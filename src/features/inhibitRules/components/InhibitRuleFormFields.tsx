import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Button, Field, Input, Stack } from '@grafana/ui';
import { t } from '@grafana/i18n';
import { normalizeInhibitRuleMatchers, type InhibitRule } from '@grafana/external-alertmanager/vanilla';

/**
 * Matchers are stored as string arrays in the API (e.g. ["severity = critical", "team = ops"]).
 * The form represents them as a single newline-separated string for easy editing.
 */
export const InhibitRuleFormSchema = z.object({
  sourceMatchers: z.string().min(1, 'At least one source matcher is required'),
  targetMatchers: z.string().min(1, 'At least one target matcher is required'),
  equal: z.string().optional(),
});

export type InhibitRuleFormData = z.infer<typeof InhibitRuleFormSchema>;

/**
 * Convert a newline-separated string of matchers to a string array,
 * filtering out blank lines.
 */
export function matchersStringToArray(value: string): string[] {
  return value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Convert a string array of matchers to a newline-separated string for the form.
 */
export function matchersArrayToString(matchers: string[] | undefined): string {
  return (matchers ?? []).join('\n');
}

/**
 * Convert an InhibitRule (API shape) to InhibitRuleFormData.
 *
 * Runs the rule through normalizeInhibitRuleMatchers first so that deprecated
 * fields (source_match, source_match_re, target_match, target_match_re) are
 * merged into the modern source_matchers/target_matchers string arrays before
 * the form sees them. Without this step, rules that arrived from an older
 * Alertmanager using only the deprecated fields would show empty matcher fields.
 */
export function inhibitRuleToFormData(rule: InhibitRule): InhibitRuleFormData {
  const normalized = normalizeInhibitRuleMatchers(rule);
  return {
    sourceMatchers: matchersArrayToString(
      normalized.source_matchers.map(([name, op, value]) => `${name} ${op} ${value.trim()}`)
    ),
    targetMatchers: matchersArrayToString(
      normalized.target_matchers.map(([name, op, value]) => `${name} ${op} ${value.trim()}`)
    ),
    equal: (normalized.equal ?? []).join(', '),
  };
}

/**
 * Convert a NormalizedInhibitRule (ObjectMatcher[] matchers) back to an InhibitRule (string[] matchers)
 * suitable for populating the form or sending to the API.
 */
export function normalizedInhibitRuleToInhibitRule(rule: {
  source_matchers: Array<[string, string, string]>;
  target_matchers: Array<[string, string, string]>;
  equal?: string[];
}): InhibitRule {
  return {
    source_matchers: rule.source_matchers.map(([name, op, value]) => `${name} ${op} ${value.trim()}`),
    target_matchers: rule.target_matchers.map(([name, op, value]) => `${name} ${op} ${value.trim()}`),
    equal: rule.equal,
  };
}

/**
 * Convert InhibitRuleFormData back to an InhibitRule for the API.
 */
export function formDataToInhibitRule(data: InhibitRuleFormData): InhibitRule {
  return {
    source_matchers: matchersStringToArray(data.sourceMatchers),
    target_matchers: matchersStringToArray(data.targetMatchers),
    equal: data.equal
      ? data.equal
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined,
  };
}

interface InhibitRuleFormFieldsProps {
  inhibitRule?: InhibitRule;
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
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InhibitRuleFormData>({
    resolver: zodResolver(InhibitRuleFormSchema),
    defaultValues: {
      sourceMatchers: '',
      targetMatchers: '',
      equal: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (inhibitRule) {
      reset(inhibitRuleToFormData(inhibitRule));
    }
  }, [inhibitRule, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack direction="column" gap={2}>
        {Boolean(error) && (
          <Alert
            title={
              isEditMode
                ? t('inhibit-rules.form.error-updating-title', 'Error updating inhibit rule')
                : t('inhibit-rules.form.error-creating-title', 'Error creating inhibit rule')
            }
            severity="error"
          >
            {String(
              error instanceof Error ? error.message : t('inhibit-rules.form.error-generic', 'An error occurred')
            )}
          </Alert>
        )}

        <Field
          noMargin
          label={t('inhibit-rules.form.source-matchers-label', 'Source Matchers')}
          description={t(
            'inhibit-rules.form.source-matchers-description',
            'One matcher per line (e.g. severity = critical). The source alert must match all of these.'
          )}
          invalid={!!errors.sourceMatchers}
          error={errors.sourceMatchers?.message}
          required
        >
          <Input
            {...register('sourceMatchers')}
            placeholder={t('inhibit-rules.form.source-matchers-placeholder', 'severity = critical')}
          />
        </Field>

        <Field
          noMargin
          label={t('inhibit-rules.form.target-matchers-label', 'Target Matchers')}
          description={t(
            'inhibit-rules.form.target-matchers-description',
            'One matcher per line (e.g. severity = warning). Matching alerts will be suppressed.'
          )}
          invalid={!!errors.targetMatchers}
          error={errors.targetMatchers?.message}
          required
        >
          <Input
            {...register('targetMatchers')}
            placeholder={t('inhibit-rules.form.target-matchers-placeholder', 'severity = warning')}
          />
        </Field>

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
