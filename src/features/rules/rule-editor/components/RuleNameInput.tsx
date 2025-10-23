import React from 'react';
import { useFormContext } from 'react-hook-form';

import { t } from '@grafana/i18n';
import { Field, Input, Stack } from '@grafana/ui';

import { RuleFormValues } from '../types';
import { RuleEditorSection } from './RuleEditorSection';

export const RuleNameInput = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<RuleFormValues>();

  return (
    <RuleEditorSection
      stepNo={1}
      title={t('alerting.rule-name-input.title-define-alert-rule', 'Define rule')}
      description={t('alerting.rule-name-input.description-name-your-alert', 'Name your alert rule.')}
    >
      <Stack direction="row" alignItems="flex-start">
        <Field
          label={t('alerting.rule-name-input.label-rule-name', 'Rule name')}
          error={errors.name?.message}
          invalid={!!errors.name}
          required
        >
          <Input
            id="rule-name"
            {...register('name', {
              required: t('alerting.rule-name-input.message.rule-name-is-required', 'Rule name is required.'),
            })}
            autoFocus
            placeholder={t(
              'alerting.rule-name-input.placeholder-give-your-alert-a-name',
              'Give your alert rule a name'
            )}
          />
        </Field>
      </Stack>
    </RuleEditorSection>
  );
};
