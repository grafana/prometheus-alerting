import { z } from 'zod';
import { t } from '@grafana/i18n';
import { RuleFormType } from './types';

/**
 * Creates the Zod schema for rule form validation
 * This is a function to ensure t() calls happen at runtime, not at module load time
 */
export function createRuleFormSchema() {
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

    // No form field, but the resolver's output is what gets submitted -- leave this out and the
    // value we read off the existing rule is stripped before it can be written back.
    keepFiringFor: z.string().optional(),

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
