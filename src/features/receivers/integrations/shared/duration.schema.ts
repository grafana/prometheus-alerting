import { t } from '@grafana/i18n';
import { z } from 'zod';

/**
 * Alertmanager reads durations in two different ways depending on which field you're filling in,
 * and the two disagree about what counts as valid. Checking the wrong one either blocks a value
 * the backend is perfectly happy with, or lets through one it rejects on save, so every duration
 * field picks the schema that matches how Alertmanager reads it.
 *
 * Both readers take a bare "0" without a unit, and we treat an empty field as "not set" rather
 * than as a broken value - whether the field is required at all is the integration's business.
 */

/**
 * How Go itself reads a duration. Pushover's retry, expire and ttl use this, and so does the
 * webhook timeout, which Alertmanager switched to this reader in 0.33.
 *
 * A run of number-and-unit pairs, with the units ns, us, ms, s, m and h. Numbers can have a
 * decimal point, so "1.5h" and "100ms" both work. There is no unit for days or anything longer.
 */
const GO_DURATION = /^[-+]?(?:(?:\d+(?:\.\d*)?|\.\d+)(?:ns|us|µs|μs|ms|s|m|h))+$/;

export const goDurationSchema = z
  .string()
  .superRefine((value, ctx) => {
    if (value === '' || value === '0' || GO_DURATION.test(value)) {
      return;
    }
    ctx.addIssue({
      code: 'custom',
      message: t('receivers.form.go-duration-invalid', 'Enter a duration such as 30s, 5m30s, or 1.5h'),
    });
  })
  .optional();

/**
 * How Prometheus reads a duration. Jira's reopen duration uses this.
 *
 * Whole numbers only, with the units ms, s, m, h, d, w and y, and the units have to appear
 * largest first. So "1d12h" works, "12h1d" doesn't, and neither does "1.5h".
 */
const PROMETHEUS_DURATION = /^(?:\d+y)?(?:\d+w)?(?:\d+d)?(?:\d+h)?(?:\d+m)?(?:\d+s)?(?:\d+ms)?$/;

export const prometheusDurationSchema = z
  .string()
  .superRefine((value, ctx) => {
    if (value === '' || value === '0' || PROMETHEUS_DURATION.test(value)) {
      return;
    }
    ctx.addIssue({
      code: 'custom',
      message: t('receivers.form.prometheus-duration-invalid', 'Enter a duration such as 30s, 5m, or 1d12h'),
    });
  })
  .optional();
