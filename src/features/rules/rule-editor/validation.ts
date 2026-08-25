import { z } from 'zod';
import { t } from '@grafana/i18n';
import { isValidPrometheusDuration } from '../../../utils/time.utils';
import { RuleFormType } from './types';
import { isCloudRecordingRuleByType } from './ruleTypeHelpers';

/**
 * A recording rule's name becomes the name of the metric it writes. Mimir (and Prometheus, and
 * Loki) only accept metric names made of letters, digits, underscores and colons, and they can't
 * start with a digit. Saving a rule with a name outside that shape is rejected by the ruler, so
 * checking it here catches the mistake before the round trip instead of after.
 */
const METRIC_NAME_PATTERN = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/;

/**
 * Creates the Zod schema for rule form validation
 * This is a function to ensure t() calls happen at runtime, not at module load time
 */
export function createRuleFormSchema() {
  return createRuleFormObjectSchema().superRefine((values, ctx) => {
    if (!isCloudRecordingRuleByType(values.type) || values.name.length === 0) {
      // Empty names are already reported by the `name` field's own `min(1)` check.
      return;
    }

    if (values.name.includes('{') || values.name.includes('}')) {
      ctx.addIssue({
        code: 'custom',
        path: ['name'],
        message: t(
          'alerting.rule-form.validation.name-braces',
          "Recording rule names can't contain braces -- did you mean to put this in the expression instead?"
        ),
      });
      return;
    }

    if (!METRIC_NAME_PATTERN.test(values.name)) {
      ctx.addIssue({
        code: 'custom',
        path: ['name'],
        message: t(
          'alerting.rule-form.validation.name-invalid-metric-name',
          "Recording rule names can only contain letters, numbers, underscores and colons, and can't start with a number"
        ),
      });
    }
  });
}

function createRuleFormObjectSchema() {
  return z.object({
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
    labels: z.array(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    ),

    annotations: z.array(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    ),
  });
}

export type RuleFormSchema = z.infer<ReturnType<typeof createRuleFormSchema>>;
