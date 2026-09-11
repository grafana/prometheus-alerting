import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { byRole, byText } from 'testing-library-selector';
import { vi } from 'vitest';

import { normalizeInhibitRuleMatchers, type NormalizedInhibitRule } from '@grafana/external-alertmanager/vanilla';

import { InhibitRuleFormFields } from './InhibitRuleFormFields';
import { type InhibitRuleFormData, formDataToInhibitRule } from './InhibitRuleFormModel';

const ui = {
  sourceMatchers: byRole('group', { name: 'Source Matchers' }),
  targetMatchers: byRole('group', { name: 'Target Matchers' }),
  matcherLabel: byRole<HTMLInputElement>('textbox', { name: 'Label' }),
  matcherValue: byRole<HTMLTextAreaElement>('textbox', { name: 'Value' }),
  requiredError: byText('Required'),
  addSourceMatcher: byRole('button', { name: 'Add source matcher' }),
  removeSourceMatcher: byRole('button', { name: 'Remove source matcher' }),
  createButton: byRole('button', { name: 'Create' }),
  updateButton: byRole('button', { name: 'Update' }),
  cancelButton: byRole('button', { name: 'Cancel' }),
};

interface Submission {
  count: number;
  data?: InhibitRuleFormData;
}

function submittedData(submission: Submission): InhibitRuleFormData {
  if (!submission.data) {
    throw new Error('Expected the form to submit data');
  }
  return submission.data;
}

function renderForm(inhibitRule?: NormalizedInhibitRule) {
  const submission: Submission = { count: 0 };
  const onSubmit = (data: InhibitRuleFormData) => {
    submission.count += 1;
    submission.data = data;
  };
  const view = render(
    <InhibitRuleFormFields inhibitRule={inhibitRule} onSubmit={onSubmit} onCancel={vi.fn()} isLoading={false} />
  );
  return { submission, onSubmit, ...view };
}

describe('InhibitRuleFormFields', () => {
  it('validates source and target labels independently and preserves empty values', async () => {
    const user = userEvent.setup();
    const { submission } = renderForm();
    const source = ui.sourceMatchers.get();
    const target = ui.targetMatchers.get();

    await user.type(ui.matcherLabel.get(source), '   ');
    await user.click(ui.createButton.get());

    expect(await ui.requiredError.find(source)).toBeInTheDocument();
    expect(await ui.requiredError.find(target)).toBeInTheDocument();
    expect(submission.count).toBe(0);

    await user.clear(ui.matcherLabel.get(source));
    await user.type(ui.matcherLabel.get(source), 'source');
    await waitFor(() => expect(ui.requiredError.query(source)).not.toBeInTheDocument());
    await user.type(ui.matcherLabel.get(target), 'target');
    await user.click(ui.createButton.get());

    await waitFor(() => expect(submission.count).toBe(1));
    expect(submittedData(submission)).toMatchObject({
      sourceMatchers: [{ name: 'source', operator: '=', value: '' }],
      targetMatchers: [{ name: 'target', operator: '=', value: '' }],
    });
  });

  it('preserves source matcher row order after adding and removing a middle row', async () => {
    const user = userEvent.setup();
    const { submission } = renderForm();
    const source = ui.sourceMatchers.get();
    const target = ui.targetMatchers.get();

    await user.type(ui.matcherLabel.get(source), 'source');
    await user.type(ui.matcherLabel.get(target), 'target');
    await user.click(ui.addSourceMatcher.get(source));
    await user.type(ui.matcherLabel.getAll(source)[1], 'middle');
    await user.click(ui.addSourceMatcher.get(source));
    await user.type(ui.matcherLabel.getAll(source)[2], 'last');
    await user.click(ui.removeSourceMatcher.getAll(source)[1]);
    await user.click(ui.createButton.get());

    await waitFor(() => expect(submission.count).toBe(1));
    expect(submittedData(submission).sourceMatchers).toEqual([
      { name: 'source', operator: '=', value: '' },
      { name: 'last', operator: '=', value: '' },
    ]);
  });

  it('hydrates semantic TextArea values and submits their canonical matcher syntax', async () => {
    const user = userEvent.setup();
    const rule = normalizeInhibitRuleMatchers({
      source_matchers: ['message="first\\nsecond"', '"team name"!="日本語 \\"primary\\""', '" team "="value"'],
      target_matchers: ['path=~"C:\\\\temp\\\\.*"'],
    });
    const { submission } = renderForm(rule);
    const source = ui.sourceMatchers.get();

    const values = ui.matcherValue.getAll(source);
    expect(values[0].tagName).toBe('TEXTAREA');
    expect(values[0]).toHaveValue('first\nsecond');
    expect(values[1]).toHaveValue('日本語 "primary"');
    expect(ui.matcherLabel.getAll(source)[2]).toHaveValue(' team ');

    await user.click(ui.updateButton.get());
    await waitFor(() => expect(submission.count).toBe(1));

    expect(formDataToInhibitRule(submittedData(submission))).toEqual({
      source_matchers: ['message="first\\nsecond"', '"team name"!="日本語 \\"primary\\""', '" team "="value"'],
      target_matchers: ['path=~"C:\\\\temp\\\\.*"'],
      equal: undefined,
    });
  });

  it('blocks physical CR and CRLF values before browser TextAreas can normalize them', async () => {
    const onCancel = vi.fn();
    render(
      <InhibitRuleFormFields
        inhibitRule={{
          source_matchers: [['message', '=', 'first\r\nsecond']],
          target_matchers: [['target\rname', '=', 'value']],
        }}
        onSubmit={vi.fn()}
        onCancel={onCancel}
        isLoading={false}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('This inhibit rule cannot be edited here');
    expect(screen.getByRole('alert')).toHaveTextContent('carriage return');
    expect(ui.updateButton.query()).not.toBeInTheDocument();

    await userEvent.setup().click(ui.cancelButton.get());
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('resets independent semantic rows before unchanged submission', async () => {
    const user = userEvent.setup();
    const initialRule: NormalizedInhibitRule = {
      source_matchers: [['initial', '!=', 'old value']],
      target_matchers: [['initialTarget', '=~', 'old.*']],
    };
    const resetRule = normalizeInhibitRuleMatchers({
      source_matchers: ['service=~"platform.*"', 'message!="\\"literal\\""'],
      target_matchers: ['"🚨"!~"a,b{c}=~d"', 'empty=""'],
      equal: ['alertname'],
    });
    const { submission, onSubmit, rerender } = renderForm(initialRule);

    rerender(
      <InhibitRuleFormFields inhibitRule={resetRule} onSubmit={onSubmit} onCancel={vi.fn()} isLoading={false} />
    );

    const source = ui.sourceMatchers.get();
    const target = ui.targetMatchers.get();
    await waitFor(() => expect(ui.matcherLabel.getAll(source)).toHaveLength(2));
    expect(ui.matcherValue.getAll(source).map((input) => input.getAttribute('rows'))).toEqual(['1', '1']);
    expect(ui.matcherValue.getAll(target).map((input) => input.value)).toEqual(['a,b{c}=~d', '']);

    await user.click(ui.updateButton.get());
    await waitFor(() => expect(submission.count).toBe(1));
    expect(formDataToInhibitRule(submittedData(submission))).toEqual({
      source_matchers: ['service=~"platform.*"', 'message!="\\"literal\\""'],
      target_matchers: ['"🚨"!~"a,b{c}=~d"', 'empty=""'],
      equal: ['alertname'],
    });
  });
});
