import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Field, FieldSet, Input, Stack } from '@grafana/ui';
import { t } from '@grafana/i18n';
import { type NormalizedInhibitRule } from '@grafana/external-alertmanager/vanilla';

import { MutationError } from '../../../access-control/components/MutationError';
import { MatcherFieldArray } from '../../../components/MatcherFieldArray';
import { emptyMatcherFieldValue, matcherOperators } from '../../../types/matcherFields';
import {
  hasUnsupportedCarriageReturn,
  isEditableMatcherValueToken,
  normalizedInhibitRuleToFormData,
  type InhibitRuleFormData,
} from './InhibitRuleFormModel';

function createInhibitRuleFormSchema() {
  const matcher = z.object({
    name: z.string().trim().min(1, t('inhibit-rules.form.matcher-required', 'Required')),
    operator: z.enum(matcherOperators),
    value: z
      .string()
      .refine(isEditableMatcherValueToken, t('inhibit-rules.form.matcher-value-invalid', 'Invalid matcher value')),
  });

  return z.object({
    sourceMatchers: z.array(matcher).min(1, 'At least one source matcher is required'),
    targetMatchers: z.array(matcher).min(1, 'At least one target matcher is required'),
    equal: z.string().optional(),
  });
}

interface InhibitRuleFormFieldsProps {
  inhibitRule?: NormalizedInhibitRule;
  onSubmit: (data: InhibitRuleFormData) => void | Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error?: unknown;
  submitButtonText?: string;
  cancelButtonText?: string;
}

export function InhibitRuleFormFields({
  inhibitRule,
  onSubmit,
  onCancel,
  isLoading,
  error,
  submitButtonText,
  cancelButtonText,
}: InhibitRuleFormFieldsProps) {
  const isEditMode = Boolean(inhibitRule);
  const hasUnsupportedValue = inhibitRule ? hasUnsupportedCarriageReturn(inhibitRule) : false;
  const {
    control,
    register,
    getFieldState,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InhibitRuleFormData>({
    resolver: zodResolver(createInhibitRuleFormSchema()),
    defaultValues: {
      sourceMatchers: [emptyMatcherFieldValue],
      targetMatchers: [emptyMatcherFieldValue],
      equal: '',
    },
  });

  useEffect(() => {
    if (inhibitRule && !hasUnsupportedValue) {
      reset(normalizedInhibitRuleToFormData(inhibitRule));
    }
  }, [hasUnsupportedValue, inhibitRule, reset]);

  if (hasUnsupportedValue) {
    return (
      <Stack direction="column" gap={2}>
        <Alert
          title={t('inhibit-rules.form.unsupported-value-title', 'This inhibit rule cannot be edited here')}
          severity="error"
        >
          {t(
            'inhibit-rules.form.unsupported-value-description',
            'This inhibit rule contains a carriage return in a matcher value. Editing it here could change the configuration. Edit it in the Alertmanager configuration instead.'
          )}
        </Alert>
        <Stack direction="row" gap={2}>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            {cancelButtonText ?? t('inhibit-rules.form.cancel-button', 'Cancel')}
          </Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack direction="column" gap={2}>
        <MutationError
          error={error}
          fallbackTitle={
            isEditMode
              ? t('inhibit-rules.form.error-updating-title', 'Error updating inhibit rule')
              : t('inhibit-rules.form.error-creating-title', 'Error creating inhibit rule')
          }
          resource={t('inhibit-rules.resource-label', 'inhibit rules')}
        />

        <FieldSet label={t('inhibit-rules.form.source-matchers-label', 'Source Matchers')}>
          <p>
            {t(
              'inhibit-rules.form.source-matchers-description',
              'The source alert must match all of these matchers. Enter matcher values as Alertmanager syntax; quotes and escapes such as \\n are preserved.'
            )}
          </p>
          <MatcherFieldArray
            control={control}
            register={register}
            getFieldState={getFieldState}
            name="sourceMatchers"
            newMatcher={emptyMatcherFieldValue}
            minRows={1}
            labels={{
              addMatcher: t('inhibit-rules.form.add-source-matcher', 'Add source matcher'),
              removeMatcher: t('inhibit-rules.form.remove-source-matcher', 'Remove source matcher'),
            }}
          />
        </FieldSet>

        <FieldSet label={t('inhibit-rules.form.target-matchers-label', 'Target Matchers')}>
          <p>
            {t(
              'inhibit-rules.form.target-matchers-description',
              'Matching alerts will be suppressed. Enter matcher values as Alertmanager syntax; quotes and escapes such as \\n are preserved.'
            )}
          </p>
          <MatcherFieldArray
            control={control}
            register={register}
            getFieldState={getFieldState}
            name="targetMatchers"
            newMatcher={emptyMatcherFieldValue}
            minRows={1}
            labels={{
              addMatcher: t('inhibit-rules.form.add-target-matcher', 'Add target matcher'),
              removeMatcher: t('inhibit-rules.form.remove-target-matcher', 'Remove target matcher'),
            }}
          />
        </FieldSet>

        <Field
          noMargin
          label={t('inhibit-rules.form.equal-label', 'Equal Labels')}
          description={t(
            'inhibit-rules.form.equal-description',
            'Comma-separated label names that must be equal in both source and target alerts (e.g. alertname, instance).'
          )}
          invalid={!!errors.equal}
          error={errors.equal?.message}
        >
          <Input
            {...register('equal')}
            placeholder={t('inhibit-rules.form.equal-placeholder', 'alertname, instance')}
          />
        </Field>

        <Stack direction="row" gap={2}>
          <Button type="submit" disabled={isLoading}>
            {submitButtonText ??
              (isLoading
                ? isEditMode
                  ? t('inhibit-rules.form.updating', 'Updating...')
                  : t('inhibit-rules.form.creating', 'Creating...')
                : isEditMode
                  ? t('inhibit-rules.form.update-button', 'Update')
                  : t('inhibit-rules.form.create-button', 'Create'))}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
            {cancelButtonText ?? t('inhibit-rules.form.cancel-button', 'Cancel')}
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
