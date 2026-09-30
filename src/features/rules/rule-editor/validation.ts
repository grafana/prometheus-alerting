import { z } from 'zod';

import { t } from '@grafana/i18n';

import { isValidMetricName } from '@grafana/external-rules/utils';

import { isValidPrometheusDuration } from '../../../utils/time.utils';
import { KVObject, RuleFormType } from './types';
import { isCloudRecordingRuleByType } from './ruleTypeHelpers';

/**
 * The message shown on a label row whose key repeats an earlier row. Shared with the labels
 * editor modal so the user sees the same wording whether the modal catches it or the form does.
 */
export function duplicateLabelKeyMessage() {
  return t('alerting.rule-form.validation.duplicate-label-key', 'This label key is already used');
}

/**
 * Finds the rows that repeat a key used by an earlier row. Only the repeats are returned, not the
 * first row that introduced the key, so the message lands on the row the user just typed.
 *
 * Keys are compared with surrounding spaces removed, because ` team` and `team` would end up as
 * the same label on the rule. Rows with a blank key are skipped -- they are the empty rows the
 * editor keeps around, and they get dropped before the rule is saved. Capitals do count:
 * Prometheus label keys are case-sensitive, so `team` and `Team` really are two different keys.
 */
export function findDuplicateKeyIndexes(items: readonly KVObject[]): number[] {
  const seen = new Set<string>();
  const duplicates: number[] = [];

  items.forEach(({ key }, index) => {
    const trimmed = key.trim();
    if (trimmed === '') {
      return;
    }
    if (seen.has(trimmed)) {
      duplicates.push(index);
      return;
    }
    seen.add(trimmed);
  });

  return duplicates;
}

/** Puts `message` on the key field of every row that repeats an earlier row's key. */
function reportDuplicateKeys(items: readonly KVObject[], ctx: z.RefinementCtx, message: string) {
  for (const index of findDuplicateKeyIndexes(items)) {
    ctx.addIssue({ code: 'custom', path: [index, 'key'], message });
  }
}

/**
 * Creates the Zod schema for rule form validation
 * This is a function to ensure t() calls happen at runtime, not at module load time
 */
export function createRuleFormSchema() {
  return z
    .object({
      // Common fields
      name: z
        .string()
        .min(1, t('alerting.rule-form.validation.name-required', 'Rule name is required'))
        .max(255, t('alerting.rule-form.validation.name-too-long', 'Rule name must be less than 255 characters')),

      type: z.enum([RuleFormType.cloudAlerting, RuleFormType.cloudRecording]),

      dataSourceUid: z
        .string()
        .nullable()
        .refine((val) => val !== null && val.length > 0, {
          message: t('alerting.rule-form.validation.datasource-required', 'Data source is required'),
        }),

      group: z
        .string()
        .min(1, t('alerting.rule-form.validation.group-required', 'Group name is required'))
        .max(255, t('alerting.rule-form.validation.group-too-long', 'Group name must be less than 255 characters')),

      namespace: z
        .string()
        .min(1, t('alerting.rule-form.validation.namespace-required', 'Namespace is required'))
        .max(255, t('alerting.rule-form.validation.namespace-too-long', 'Namespace must be less than 255 characters')),

      expression: z.string().min(1, t('alerting.rule-form.validation.expression-required', 'Expression is required')),

      forTime: z
        .number()
        .int(t('alerting.rule-form.validation.for-time-integer', 'Must be a positive integer'))
        .min(0, t('alerting.rule-form.validation.for-time-positive', 'Must be a positive number')),

      forTimeUnit: z.string().min(1),

      // The resolver's output is what gets submitted, so this has to be listed here or the value is
      // stripped before the rule is built. Empty is allowed and means "no keep_firing_for".
      keepFiringFor: z
        .string()
        .optional()
        .refine((value) => !value || isValidPrometheusDuration(value), {
          message: t(
            'alerting.rule-form.validation.keep-firing-for-invalid',
            'Invalid duration format. Use combinations like 30s, 5m, 1h30m'
          ),
        }),

      // Labels and annotations
      labels: z
        .array(
          z.object({
            key: z.string(),
            value: z.string(),
          })
        )
        .superRefine((labels, ctx) => reportDuplicateKeys(labels, ctx, duplicateLabelKeyMessage())),

      annotations: z
        .array(
          z.object({
            key: z.string(),
            value: z.string(),
          })
        )
        .superRefine((annotations, ctx) =>
          reportDuplicateKeys(
            annotations,
            ctx,
            t('alerting.rule-form.validation.duplicate-annotation-key', 'This annotation key is already used')
          )
        ),
    })
    .refine(
      (values) =>
        // A recording rule's name becomes a metric name, so it needs the metric-name character
        // set. An alerting rule's name just becomes a label value, which accepts anything, so we
        // only check this for recording rules. Empty names are already reported by the `name`
        // field's own `min(1)` check.
        !isCloudRecordingRuleByType(values.type) || values.name.length === 0 || isValidMetricName(values.name),
      {
        message: t(
          'alerting.rule-form.validation.name-invalid-metric-name',
          "Recording rule names can only contain letters, numbers, underscores and colons, and can't start with a number"
        ),
        path: ['name'],
      }
    );
}

export type RuleFormSchema = z.infer<ReturnType<typeof createRuleFormSchema>>;
