import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { defaultFormValuesForRuleType } from '../formDefaults';
import { RuleFormType, RuleFormValues } from '../types';
import { createRuleFormSchema } from '../validation';
import { LabelsField } from './LabelsField';

function renderStep(labels: RuleFormValues['labels']) {
  const onSubmit = vi.fn();

  function Wrapper() {
    const methods = useForm<RuleFormValues>({
      // Everything but the labels is filled in, so a blocked save can only be the labels' fault
      defaultValues: {
        ...defaultFormValuesForRuleType(RuleFormType.cloudAlerting),
        name: 'HighErrorRate',
        dataSourceUid: 'ds-uid',
        group: 'group',
        namespace: 'namespace',
        expression: 'up == 0',
        labels,
      },
      resolver: zodResolver(createRuleFormSchema()),
    });

    return (
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <LabelsField />
          <button type="submit">Save rule</button>
        </form>
      </FormProvider>
    );
  }

  render(<Wrapper />);

  return {
    onSubmit,
    save: () => screen.getByRole('button', { name: 'Save rule' }),
  };
}

describe('LabelsField', () => {
  // The modal already stops a repeated key from reaching the form, so this is the backstop: if one
  // gets in anyway the blocked save has to say why instead of doing nothing
  it('names the repeated key when the form holds one, since the chips collapse it into one', async () => {
    const step = renderStep([
      { key: 'team', value: 'backend' },
      { key: 'team', value: 'frontend' },
    ]);

    await userEvent.click(step.save());

    expect(await screen.findByText('Duplicate label keys: team')).toBeInTheDocument();
    expect(step.onSubmit).not.toHaveBeenCalled();
  });

  it('names every repeated key, each one once', async () => {
    const step = renderStep([
      { key: 'team', value: 'backend' },
      { key: 'team', value: 'frontend' },
      { key: 'team', value: 'platform' },
      { key: 'env', value: 'prod' },
      { key: 'env', value: 'dev' },
    ]);

    await userEvent.click(step.save());

    expect(await screen.findByText('Duplicate label keys: team, env')).toBeInTheDocument();
  });

  it('saves distinct label keys without complaint', async () => {
    const step = renderStep([
      { key: 'team', value: 'backend' },
      { key: 'severity', value: 'critical' },
    ]);

    await userEvent.click(step.save());

    expect(step.onSubmit).toHaveBeenCalled();
    expect(screen.queryByText(/Duplicate label keys/)).not.toBeInTheDocument();
  });
});
