import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { expect, vi } from 'vitest';

import { Button } from '@grafana/ui';

import { MatcherFieldArray, MatcherOperatorSelect } from './MatcherFieldArray';
import { type MatcherFieldValue, emptyMatcherFieldValue } from '@grafana/external-alertmanager/vanilla';

interface MatcherFormData {
  matchers: MatcherFieldValue[];
}

const labels = {
  addMatcher: 'Add matcher',
  removeMatcher: 'Remove matcher',
};

function MatcherForm({
  onSubmit,
  valueControl,
}: {
  onSubmit: (values: MatcherFormData) => void;
  valueControl?: 'input' | 'textarea';
}) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MatcherFormData>({
    defaultValues: { matchers: [emptyMatcherFieldValue] },
  });
  const matcherFields = useFieldArray({ control, name: 'matchers' });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <MatcherFieldArray
        rows={matcherFields.fields.map((field, index) => ({
          id: field.id,
          labelInput: register(`matchers.${index}.name`, { required: 'Required' }),
          operatorControl: (
            <Controller
              control={control}
              name={`matchers.${index}.operator`}
              render={({ field: { onChange, value } }) => <MatcherOperatorSelect value={value} onChange={onChange} />}
            />
          ),
          valueInput: register(`matchers.${index}.value`),
          labelError: errors.matchers?.[index]?.name?.message,
          valueError: errors.matchers?.[index]?.value?.message,
        }))}
        onAdd={() => matcherFields.append(emptyMatcherFieldValue)}
        onRemove={matcherFields.remove}
        labels={labels}
        minRows={1}
        valueControl={valueControl}
      />
      <Button type="submit">Save</Button>
    </form>
  );
}

describe('MatcherFieldArray', () => {
  it('keeps the minimum row and adds a second matcher', async () => {
    const user = userEvent.setup();
    render(<MatcherForm onSubmit={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Remove matcher' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Add matcher' }));

    expect(screen.getAllByRole('textbox', { name: 'Label' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Remove matcher' })[0]).not.toBeDisabled();
  });

  it('keeps the default value control as a single-line Input for routes', () => {
    render(<MatcherForm onSubmit={vi.fn()} />);

    expect(screen.getByRole('textbox', { name: 'Value' }).tagName).toBe('INPUT');
  });

  it('submits a semantic multiline value from its one-row TextArea', async () => {
    const user = userEvent.setup();
    let submitted: MatcherFormData | undefined;
    render(<MatcherForm onSubmit={(values) => (submitted = values)} valueControl="textarea" />);

    const value = screen.getByRole('textbox', { name: 'Value' });
    expect(value.tagName).toBe('TEXTAREA');
    expect(value).toHaveAttribute('rows', '1');

    await user.type(screen.getByRole('textbox', { name: 'Label' }), 'message');
    await user.type(value, 'first\nsecond');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(submitted).toEqual({
        matchers: [{ name: 'message', operator: '=', value: 'first\nsecond' }],
      })
    );
  });

  it('shows each operator symbol with a human-friendly description', async () => {
    // happy-dom doesn't lay anything out, so every element is 0px and the Combobox's virtualised
    // list renders no options. Give elements a size: the list reads the box's size from
    // clientHeight/clientWidth and each option's height from offsetHeight.
    const sizes = [
      vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(240),
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200),
      vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(240),
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(200),
    ];

    try {
      const user = userEvent.setup();
      render(<MatcherForm onSubmit={vi.fn()} />);

      await user.click(screen.getByRole('combobox', { name: 'Operator' }));

      expect(await screen.findByText('Equals')).toBeInTheDocument();
      expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
        '=Equals',
        '!=Does not equal',
        '=~Matches regular expression',
        '!~Does not match regular expression',
      ]);
    } finally {
      sizes.forEach((size) => size.mockRestore());
    }
  });

  it('shows and clears a required-label error without a parent form-state subscription', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<MatcherForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(screen.getByRole('textbox', { name: 'Label' }), 'severity');

    await waitFor(() => expect(screen.queryByText('Required')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0][0]).toEqual({
      matchers: [{ name: 'severity', operator: '=', value: '' }],
    });
  });
});
