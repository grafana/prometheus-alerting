import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { normalizeInhibitRuleMatchers, type NormalizedInhibitRule } from '@grafana/external-alertmanager/vanilla';

import { InhibitRuleFormFields } from './InhibitRuleFormFields';
import { type InhibitRuleFormData, formDataToInhibitRule } from './InhibitRuleFormModel';

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
  it('rejects empty labels, clears errors on change, and preserves a whitespace-only UTF-8 name', async () => {
    const user = userEvent.setup();
    const { submission } = renderForm();
    const source = screen.getByRole('group', { name: 'Source Matchers' });
    const target = screen.getByRole('group', { name: 'Target Matchers' });

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await within(source).findByText('Required')).toBeInTheDocument();
    expect(await within(target).findByText('Required')).toBeInTheDocument();
    expect(submission.count).toBe(0);

    await user.type(within(source).getByRole('textbox', { name: 'Label' }), '   ');
    await waitFor(() => expect(within(source).queryByText('Required')).not.toBeInTheDocument());
    await user.type(within(target).getByRole('textbox', { name: 'Label' }), 'target');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(submission.count).toBe(1));
    expect(submittedData(submission)).toMatchObject({
      sourceMatchers: [{ name: '   ', operator: '=', value: '' }],
      targetMatchers: [{ name: 'target', operator: '=', value: '' }],
    });
    expect(formDataToInhibitRule(submittedData(submission)).source_matchers).toEqual(['"   "=""']);
  });

  it('preserves source matcher row order after adding and removing a middle row', async () => {
    const user = userEvent.setup();
    const { submission } = renderForm();
    const source = screen.getByRole('group', { name: 'Source Matchers' });
    const target = screen.getByRole('group', { name: 'Target Matchers' });

    await user.type(within(source).getByRole('textbox', { name: 'Label' }), 'source');
    await user.type(within(target).getByRole('textbox', { name: 'Label' }), 'target');
    await user.click(within(source).getByRole('button', { name: 'Add source matcher' }));
    await user.type(within(source).getAllByRole('textbox', { name: 'Label' })[1], 'middle');
    await user.click(within(source).getByRole('button', { name: 'Add source matcher' }));
    await user.type(within(source).getAllByRole('textbox', { name: 'Label' })[2], 'last');
    await user.click(within(source).getAllByRole('button', { name: 'Remove source matcher' })[1]);
    await user.click(screen.getByRole('button', { name: 'Create' }));

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
    const source = screen.getByRole('group', { name: 'Source Matchers' });

    const values = within(source).getAllByRole<HTMLTextAreaElement>('textbox', { name: 'Value' });
    expect(values[0].tagName).toBe('TEXTAREA');
    expect(values[0]).toHaveValue('first\nsecond');
    expect(values[1]).toHaveValue('日本語 "primary"');
    expect(within(source).getAllByRole('textbox', { name: 'Label' })[2]).toHaveValue(' team ');

    await user.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(submission.count).toBe(1));

    expect(formDataToInhibitRule(submittedData(submission))).toEqual({
      source_matchers: ['message="first\\nsecond"', '"team name"!="日本語 \\"primary\\""', '" team "="value"'],
      target_matchers: ['path=~"C:\\\\temp\\\\.*"'],
      equal: undefined,
    });
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

    const source = screen.getByRole('group', { name: 'Source Matchers' });
    const target = screen.getByRole('group', { name: 'Target Matchers' });
    await waitFor(() => expect(within(source).getAllByRole('textbox', { name: 'Label' })).toHaveLength(2));
    expect(
      within(target)
        .getAllByRole<HTMLTextAreaElement>('textbox', { name: 'Value' })
        .map((input) => input.value)
    ).toEqual(['a,b{c}=~d', '']);

    await user.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(submission.count).toBe(1));
    expect(formDataToInhibitRule(submittedData(submission))).toEqual({
      source_matchers: ['service=~"platform.*"', 'message!="\\"literal\\""'],
      target_matchers: ['🚨!~"a,b{c}=~d"', 'empty=""'],
      equal: ['alertname'],
    });
  });
});
