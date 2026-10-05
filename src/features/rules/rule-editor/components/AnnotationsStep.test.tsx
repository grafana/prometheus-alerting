import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { defaultFormValuesForRuleType } from '../formDefaults';
import { RuleFormType, RuleFormValues } from '../types';
import { createRuleFormSchema } from '../validation';
import { AnnotationsStep } from './AnnotationsStep';

function renderStep(annotations: RuleFormValues['annotations']) {
  const onSubmit = rs.fn();

  function Wrapper() {
    const methods = useForm<RuleFormValues>({
      // Everything but the annotations is filled in, so a blocked save can only be the
      // annotations' fault
      defaultValues: {
        ...defaultFormValuesForRuleType(RuleFormType.cloudAlerting),
        name: 'HighErrorRate',
        dataSourceUid: 'ds-uid',
        group: 'group',
        namespace: 'namespace',
        expression: 'up == 0',
        annotations,
      },
      resolver: zodResolver(createRuleFormSchema()),
    });

    return (
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <AnnotationsStep />
          <button type="submit">Save</button>
        </form>
      </FormProvider>
    );
  }

  render(<Wrapper />);

  return {
    onSubmit,
    keys: () => screen.getAllByPlaceholderText('Annotation key'),
    save: () => screen.getByRole('button', { name: 'Save' }),
  };
}

describe('AnnotationsStep', () => {
  it('blocks saving a repeated annotation key and says so on the repeated row', async () => {
    const step = renderStep([
      { key: 'summary', value: 'one' },
      { key: 'summary', value: 'two' },
    ]);

    await userEvent.click(step.save());

    expect(await screen.findByText('This annotation key is already used')).toBeInTheDocument();
    expect(step.onSubmit).not.toHaveBeenCalled();
  });

  it('clears the message once the key is made unique', async () => {
    const step = renderStep([
      { key: 'summary', value: 'one' },
      { key: 'summary', value: 'two' },
    ]);

    await userEvent.click(step.save());
    await screen.findByText('This annotation key is already used');

    await userEvent.type(step.keys()[1], '_extra');
    await userEvent.click(step.save());

    expect(screen.queryByText('This annotation key is already used')).not.toBeInTheDocument();
    expect(step.onSubmit).toHaveBeenCalled();
  });
});
