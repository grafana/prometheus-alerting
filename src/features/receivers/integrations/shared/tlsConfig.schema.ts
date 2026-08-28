import { t } from '@grafana/i18n';
import { z } from 'zod';

/**
 * The only TLS versions Alertmanager recognises by name. Anything else comes back from the API as
 * "unknown TLS version", so we say so on the field instead.
 */
const TLS_VERSIONS = ['TLS10', 'TLS11', 'TLS12', 'TLS13'];

export const tlsVersionSchema = z
  .string()
  .superRefine((value, ctx) => {
    if (value === '' || TLS_VERSIONS.includes(value)) {
      return;
    }
    ctx.addIssue({
      code: 'custom',
      message: t('receivers.form.tls-version-invalid', 'TLS version must be TLS10, TLS11, TLS12 or TLS13'),
    });
  })
  .optional();
