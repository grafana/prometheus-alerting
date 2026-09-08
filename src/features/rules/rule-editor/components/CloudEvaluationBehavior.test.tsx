import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { defaultFormValuesForRuleType } from '../formDefaults';
import { RuleFormType, RuleFormValues } from '../types';
import { createRuleFormSchema } from '../validation';
import { CloudEvaluationBehavior } from './CloudEvaluationBehavior';

/**
 * Renders the step on its own. The data source is left unset, which keeps the namespace and
 * group fields out of the way -- they need a real data source to load their options.
 */
function renderStep(type = RuleFormType.cloudAlerting) {
  function Wrapper() {
    const methods = useForm<RuleFormValues>({
      defaultValues: { ...defaultFormValuesForRuleType(type) },
      resolver: zodResolver(createRuleFormSchema()),
    });

    return (
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(() => {})}>
          <CloudEvaluationBehavior />
          <button type="submit">Save</button>
        </form>
      </FormProvider>
    );
  }

  render(<Wrapper />);

  return {
    keepFiringFor: () => screen.getByLabelText(/Keep firing for/),
    pendingPeriod: () => screen.getByText(/Pending period/),
    save: () => screen.getByRole('button', { name: 'Save' }),
  };
}

describe('CloudEvaluationBehavior', () => {
  it('offers a keep firing for field on alerting rules', () => {
    const step = renderStep();

    expect(step.keepFiringFor()).toHaveValue('');
  });

  it('leaves it off recording rules, which have no keep_firing_for', () => {
    renderStep(RuleFormType.cloudRecording);

    expect(screen.queryByLabelText(/Keep firing for/)).not.toBeInTheDocument();
  });

  it('offers a pending period field on alerting rules', () => {
    const step = renderStep();

    expect(step.pendingPeriod()).toBeInTheDocument();
  });

  it('leaves it off recording rules, which have no `for`', () => {
    renderStep(RuleFormType.cloudRecording);

    expect(screen.queryByText(/Pending period/)).not.toBeInTheDocument();
  });

  it('takes a compound duration', async () => {
    const step = renderStep();

    await userEvent.type(step.keepFiringFor(), '1h30m');
    await userEvent.click(step.save());

    expect(screen.queryByText(/Invalid duration format/)).not.toBeInTheDocument();
  });

  it('complains about a duration it cannot parse', async () => {
    const step = renderStep();

    await userEvent.type(step.keepFiringFor(), 'ten minutes');
    await userEvent.click(step.save());

    expect(await screen.findByText(/Invalid duration format/)).toBeInTheDocument();
  });
});
