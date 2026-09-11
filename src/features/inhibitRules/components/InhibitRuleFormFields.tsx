import React, { useEffect } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Field, FieldSet, Input, Stack, Text } from '@grafana/ui';
import { t } from '@grafana/i18n';
import { type NormalizedInhibitRule } from '@grafana/external-alertmanager/vanilla';

import { MutationError } from '../../../access-control/components/MutationError';
import { MatcherFieldArray, MatcherOperatorSelect } from '../../../components/MatcherFieldArray';
import { emptyMatcherFieldValue, matcherOperators } from '../../../types/matcherFields';
import { normalizedInhibitRuleToFormData, type InhibitRuleFormData } from './InhibitRuleFormModel';

function createInhibitRuleFormSchema() {
  const matcher = z.object({
    name: z.string().min(1, t('inhibit-rules.form.matcher-required', 'Required')),
    operator: z.enum(matcherOperators),
    value: z.string(),
  });

  return z.object({
    sourceMatchers: z
      .array(matcher)
      .min(1, t('inhibit-rules.form.source-matcher-required', 'At least one source matcher is required')),
    targetMatchers: z
      .array(matcher)
      .min(1, t('inhibit-rules.form.target-matcher-required', 'At least one target matcher is required')),
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
  const {
    control,
    register,
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

  const sourceMatcherFields = useFieldArray({ control, name: 'sourceMatchers' });
  const targetMatcherFields = useFieldArray({ control, name: 'targetMatchers' });

  useEffect(() => {
    if (inhibitRule) {
      reset(normalizedInhibitRuleToFormData(inhibitRule));
    }
  }, [inhibitRule, reset]);

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
          <Text element="p" color="secondary">
            {t(
              'inhibit-rules.form.source-matchers-description',
              'The source alert must match all of these matchers. Enter values normally; they are escaped for Alertmanager when saved.'
            )}
          </Text>
          <MatcherFieldArray
            rows={sourceMatcherFields.fields.map((field, index) => ({
              id: field.id,
              labelInput: register(`sourceMatchers.${index}.name`),
              operatorControl: (
                <Controller
                  control={control}
                  name={`sourceMatchers.${index}.operator`}
                  render={({ field: { onChange, value } }) => (
                    <MatcherOperatorSelect value={value} onChange={onChange} />
                  )}
                />
              ),
              valueInput: register(`sourceMatchers.${index}.value`),
              labelError: errors.sourceMatchers?.[index]?.name?.message,
              valueError: errors.sourceMatchers?.[index]?.value?.message,
            }))}
            onAdd={() => sourceMatcherFields.append(emptyMatcherFieldValue)}
            onRemove={sourceMatcherFields.remove}
            minRows={1}
            valueControl="textarea"
            labels={{
              addMatcher: t('inhibit-rules.form.add-source-matcher', 'Add source matcher'),
              removeMatcher: t('inhibit-rules.form.remove-source-matcher', 'Remove source matcher'),
            }}
          />
        </FieldSet>

        <FieldSet label={t('inhibit-rules.form.target-matchers-label', 'Target Matchers')}>
          <Text element="p" color="secondary">
            {t(
              'inhibit-rules.form.target-matchers-description',
              'Matching alerts will be suppressed. Enter values normally; they are escaped for Alertmanager when saved.'
            )}
          </Text>
          <MatcherFieldArray
            rows={targetMatcherFields.fields.map((field, index) => ({
              id: field.id,
              labelInput: register(`targetMatchers.${index}.name`),
              operatorControl: (
                <Controller
                  control={control}
                  name={`targetMatchers.${index}.operator`}
                  render={({ field: { onChange, value } }) => (
                    <MatcherOperatorSelect value={value} onChange={onChange} />
                  )}
                />
              ),
              valueInput: register(`targetMatchers.${index}.value`),
              labelError: errors.targetMatchers?.[index]?.name?.message,
              valueError: errors.targetMatchers?.[index]?.value?.message,
            }))}
            onAdd={() => targetMatcherFields.append(emptyMatcherFieldValue)}
            onRemove={targetMatcherFields.remove}
            minRows={1}
            valueControl="textarea"
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
