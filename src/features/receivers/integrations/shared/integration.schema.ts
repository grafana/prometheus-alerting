import { z } from 'zod';

/**
 * The parts every integration in the receiver form shares. `type` stays a literal so the form can
 * tell one integration from another in a discriminated union.
 */
export function createIntegrationFormSchema<Type extends string, Settings extends z.core.SomeType>(
  type: Type,
  settings: Settings
) {
  return z.object({
    type: z.literal(type),
    sendResolved: z.boolean(),
    settings,
  });
}
