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
  it('validates source and target labels independently and preserves empty values', async () => {
    const user = userEvent.setup();
    const { submission } = renderForm();
    const source = screen.getByRole('group', { name: 'Source Matchers' });
    const target = screen.getByRole('group', { name: 'Target Matchers' });

    await user.type(within(source).getByRole('textbox', { name: 'Label' }), '   ');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await within(source).findByText('Required')).toBeInTheDocument();
    expect(await within(target).findByText('Required')).toBeInTheDocument();
    expect(submission.count).toBe(0);

    await user.clear(within(source).getByRole('textbox', { name: 'Label' }));
    await user.type(within(source).getByRole('textbox', { name: 'Label' }), 'source');
    await waitFor(() => expect(within(source).queryByText('Required')).not.toBeInTheDocument());
    await user.type(within(target).getByRole('textbox', { name: 'Label' }), 'target');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(submission.count).toBe(1));
    expect(submission.data).toMatchObject({
      sourceMatchers: [{ name: 'source', operator: '=', value: '' }],
      targetMatchers: [{ name: 'target', operator: '=', value: '' }],
    });
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
    expect(submission.data).toMatchObject({
      sourceMatchers: [
        { name: 'source', operator: '=', value: '' },
        { name: 'last', operator: '=', value: '' },
      ],
      targetMatchers: [{ name: 'target', operator: '=', value: '' }],
    });
  });

  it('renders physical newlines as visible escaped syntax and preserves it when editing', async () => {
    const user = userEvent.setup();
    const rule = normalizeInhibitRuleMatchers({
      source_matchers: ['message="a\nb"'],
      target_matchers: ['target="value"'],
    });
    const { submission } = renderForm(rule);
    const source = screen.getByRole('group', { name: 'Source Matchers' });
    const value = within(source).getByRole('textbox', { name: 'Value' });

    expect(value).toHaveValue('"a\\nb"');
    await user.click(value);
    await user.keyboard('{Backspace}c"');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(submission.count).toBe(1));
    expect(formDataToInhibitRule(submittedData(submission))).toMatchObject({
      source_matchers: ['message="a\\nbc"'],
    });
  });

  it('preserves an escaped carriage return when editing', async () => {
    const user = userEvent.setup();
    const rule = normalizeInhibitRuleMatchers({
      source_matchers: ['message="a\\rb"'],
      target_matchers: ['target="value"'],
    });
    const { submission } = renderForm(rule);
    const source = screen.getByRole('group', { name: 'Source Matchers' });
    const value = within(source).getByRole('textbox', { name: 'Value' });

    expect(value).toHaveValue('"a\\rb"');
    await user.click(value);
    await user.keyboard('{End}{Backspace}c"');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(submission.count).toBe(1));
    expect(formDataToInhibitRule(submittedData(submission))).toMatchObject({
      source_matchers: ['message="a\\rbc"'],
    });
  });

  it('preserves a physical line feed preceded by one backslash when editing', async () => {
    const user = userEvent.setup();
    const lineFeed = '\n';
    const rule = normalizeInhibitRuleMatchers({
      source_matchers: [`message="a\\${lineFeed}b"`],
      target_matchers: ['target="value"'],
    });
    const { submission } = renderForm(rule);
    const source = screen.getByRole('group', { name: 'Source Matchers' });
    const value = within(source).getByRole('textbox', { name: 'Value' });

    expect(value).toHaveValue(String.raw`"a\\\nb"`);
    await user.click(value);
    await user.keyboard('{End}{Backspace}c"');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(submission.count).toBe(1));
    expect(formDataToInhibitRule(submittedData(submission))).toMatchObject({
      source_matchers: [String.raw`message="a\\\nbc"`],
    });
  });

  it('blocks modern and legacy carriage return values before they reach matcher inputs', async () => {
    const user = userEvent.setup();
    const submission: Submission = { count: 0 };
    const onSubmit = (data: InhibitRuleFormData) => {
      submission.count += 1;
      submission.data = data;
    };
    const onCancel = vi.fn();
    const modernRule = normalizeInhibitRuleMatchers({
      source_matchers: ['message="a\rb"'],
      target_matchers: ['target="value"'],
    });
    const legacyRule = normalizeInhibitRuleMatchers({
      source_match: { message: 'a\r\nb' },
      target_match: { target: 'value' },
    });
    const { rerender } = render(
      <InhibitRuleFormFields inhibitRule={modernRule} onSubmit={onSubmit} onCancel={onCancel} isLoading={false} />
    );

    expect(screen.getByText('This inhibit rule cannot be edited here')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This inhibit rule contains a carriage return in a matcher value. Editing it here could change the configuration. Edit it in the Alertmanager configuration instead.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Value' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Update' })).not.toBeInTheDocument();
    expect(submission.count).toBe(0);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledOnce();

    rerender(
      <InhibitRuleFormFields inhibitRule={legacyRule} onSubmit={onSubmit} onCancel={onCancel} isLoading={false} />
    );

    expect(screen.getByText('This inhibit rule cannot be edited here')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Value' })).not.toBeInTheDocument();
    expect(submission.count).toBe(0);
  });

  it('shows a validation error for malformed quoted values and submits after correction', async () => {
    const user = userEvent.setup();
    const { submission } = renderForm();
    const source = screen.getByRole('group', { name: 'Source Matchers' });
    const target = screen.getByRole('group', { name: 'Target Matchers' });

    await user.type(within(source).getByRole('textbox', { name: 'Label' }), 'source');
    await user.type(within(target).getByRole('textbox', { name: 'Label' }), 'target');
    await user.type(within(source).getByRole('textbox', { name: 'Value' }), '"unterminated');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await within(source).findByText('Invalid matcher value')).toBeInTheDocument();
    expect(submission.count).toBe(0);

    await user.clear(within(source).getByRole('textbox', { name: 'Value' }));
    await user.type(within(source).getByRole('textbox', { name: 'Value' }), '"corrected"');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(submission.count).toBe(1));
  });

  it('resets hydrated source and target rows and submits the unchanged normalized rule canonically', async () => {
    const user = userEvent.setup();
    const initialRule: NormalizedInhibitRule = {
      source_matchers: [['initial', '!=', 'old value']],
      target_matchers: [['initialTarget', '=~', 'old.*']],
    };
    const resetRule: NormalizedInhibitRule = {
      source_matchers: [
        ['service', '=~', '"platform.*"'],
        ['message', '!=', '"\\\"literal\\\""'],
      ],
      target_matchers: [
        ['path', '!~', '"C:\\\\temp\\\\.*"'],
        ['empty', '=', '""'],
      ],
      equal: ['alertname'],
    };
    const { submission, onSubmit, rerender } = renderForm(initialRule);

    expect(
      within(screen.getByRole('group', { name: 'Source Matchers' })).getAllByRole('textbox', { name: 'Label' })
    ).toHaveLength(1);
    expect(
      within(screen.getByRole('group', { name: 'Target Matchers' })).getByRole('combobox', { name: 'Operator' })
    ).toHaveValue('=~');

    rerender(
      <InhibitRuleFormFields inhibitRule={resetRule} onSubmit={onSubmit} onCancel={vi.fn()} isLoading={false} />
    );

    const source = screen.getByRole('group', { name: 'Source Matchers' });
    const target = screen.getByRole('group', { name: 'Target Matchers' });
    await waitFor(() => expect(within(source).getAllByRole('textbox', { name: 'Label' })).toHaveLength(2));
    expect(
      within(source)
        .getAllByRole('textbox', { name: 'Label' })
        .map((input) => (input as HTMLInputElement).value)
    ).toEqual(['service', 'message']);
    expect(
      within(source)
        .getAllByRole('combobox', { name: 'Operator' })
        .map((input) => (input as HTMLInputElement).value)
    ).toEqual(['=~', '!=']);
    expect(
      within(target)
        .getAllByRole('textbox', { name: 'Value' })
        .map((input) => (input as HTMLInputElement).value)
    ).toEqual(['"C:\\\\temp\\\\.*"', '""']);
    expect(
      within(target)
        .getAllByRole('combobox', { name: 'Operator' })
        .map((input) => (input as HTMLInputElement).value)
    ).toEqual(['!~', '=']);

    await user.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(submission.count).toBe(1));

    const submitted = submittedData(submission);
    expect(submitted).toEqual({
      sourceMatchers: [
        { name: 'service', operator: '=~', value: '"platform.*"' },
        { name: 'message', operator: '!=', value: '"\\\"literal\\\""' },
      ],
      targetMatchers: [
        { name: 'path', operator: '!~', value: '"C:\\\\temp\\\\.*"' },
        { name: 'empty', operator: '=', value: '""' },
      ],
      equal: 'alertname',
    });
    expect(formDataToInhibitRule(submitted)).toEqual({
      source_matchers: ['service=~"platform.*"', 'message!="\\\"literal\\\""'],
      target_matchers: ['path!~"C:\\\\temp\\\\.*"', 'empty=""'],
      equal: ['alertname'],
    });
  });
});
