import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { expect, vi } from 'vitest';

import { Button } from '@grafana/ui';

import { MatcherFieldArray } from './MatcherFieldArray';
import { type MatcherFieldValue, emptyMatcherFieldValue } from '../types/matcherFields';

interface MatcherFormData {
  matchers: MatcherFieldValue[];
}

const labels = {
  addMatcher: 'Add matcher',
  removeMatcher: 'Remove matcher',
};

function MatcherForm({ onSubmit }: { onSubmit: (values: MatcherFormData) => void }) {
  const form = useForm<MatcherFormData>({
    defaultValues: { matchers: [emptyMatcherFieldValue] },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <MatcherFieldArray
        control={form.control}
        register={form.register}
        getFieldState={form.getFieldState}
        name="matchers"
        newMatcher={emptyMatcherFieldValue}
        labels={labels}
        minRows={1}
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

  it('shows each operator symbol with a human-friendly description', async () => {
    const offsetHeight = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(240);
    const offsetWidth = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(200);

    try {
      const user = userEvent.setup();
      render(<MatcherForm onSubmit={vi.fn()} />);

      await user.click(screen.getByRole('combobox', { name: 'Operator' }));

      expect(await screen.findByText('Equals')).toBeInTheDocument();
      expect(screen.getByText('Does not equal')).toBeInTheDocument();
      expect(screen.getByText('Matches regular expression')).toBeInTheDocument();
      expect(screen.getByText('Does not match regular expression')).toBeInTheDocument();
      expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
        '=Equals',
        '!=Does not equal',
        '=~Matches regular expression',
        '!~Does not match regular expression',
      ]);
    } finally {
      offsetHeight.mockRestore();
      offsetWidth.mockRestore();
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
