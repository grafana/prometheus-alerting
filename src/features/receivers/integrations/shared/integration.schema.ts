import { z } from 'zod';

/**
 * Alertmanager rejects a config where one of these settings isn't a full URL, with "unsupported
 * scheme". We check the same thing so the message shows up on the field instead.
 *
 * Only the scheme is checked. `z.httpUrl()` would also demand a dotted hostname, which rules out
 * localhost, IP addresses and in-cluster names like http://alertmanager - all fine by Alertmanager.
 */
const httpUrl = z.url({ protocol: /^https?$/, hostname: /.*/ });

type UrlField = {
  /** Key inside the integration's settings, e.g. `webhook_url`. */
  name: string;
  /** Message shown on that field when the value is not an absolute http(s) URL. */
  message: string;
};

/**
 * The parts every integration shares. `type` stays a literal so the form can tell them apart.
 *
 * `urlFields` are checked here, not in the settings schema, because the settings schema also runs
 * when we load a saved config into the form. A bad URL there should still let you open the form and
 * fix it - so the check only runs when the form is submitted.
 */
export function createIntegrationFormSchema<Type extends string, Settings extends z.core.SomeType>(
  type: Type,
  settings: Settings,
  urlFields: readonly UrlField[] = []
) {
  return z
    .object({
      type: z.literal(type),
      sendResolved: z.boolean(),
      settings,
    })
    .superRefine((integration, ctx) => {
      const { settings: values } = integration as { settings?: Record<string, unknown> };
      for (const field of urlFields) {
        const value = values?.[field.name];
        // Empty is left alone; whether the field is required is the settings schema's business.
        if (typeof value === 'string' && value !== '' && !httpUrl.safeParse(value).success) {
          ctx.addIssue({ code: 'custom', message: field.message, path: ['settings', field.name] });
        }
      }
    });
}
