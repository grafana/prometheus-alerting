import { z } from 'zod';

type InlineOrFilePair = {
  /** Field holding the value itself. */
  inline: string;
  /** Field holding a path to a file containing the value. */
  file: string;
  /** Message to show when neither is filled in. Leave it out when the pair is optional. */
  required?: string;
  /** Message to show when both are filled in. */
  conflict: string;
};

type StringFields<Pairs extends readonly InlineOrFilePair[]> = {
  [Key in Pairs[number]['inline'] | Pairs[number]['file']]: z.ZodOptional<z.ZodString>;
};

/**
 * Alertmanager takes a secret either directly or as a path to a file holding it, never both.
 *
 * Returns the two fields with that rule attached. Add the integration's own fields on top with
 * `.safeExtend()`: the rule survives, and reusing one of these field names is a compile error.
 */
export function inlineOrFileFields<const Pairs extends readonly InlineOrFilePair[]>(...pairs: Pairs) {
  const shape = Object.fromEntries(
    pairs.flatMap((pair) => [
      [pair.inline, z.string().optional()],
      [pair.file, z.string().optional()],
    ])
  ) as StringFields<Pairs>;

  return z.looseObject(shape).superRefine((values, ctx) => {
    // The field names come from the caller, so read them back by name rather than by property.
    const settings: Record<string, unknown> = values;

    for (const pair of pairs) {
      const inlineValue = settings[pair.inline];
      const fileValue = settings[pair.file];

      if (pair.required && !inlineValue && !fileValue) {
        ctx.addIssue({ code: 'custom', message: pair.required, path: [pair.inline] });
      }
      if (inlineValue && fileValue) {
        ctx.addIssue({ code: 'custom', message: pair.conflict, path: [pair.inline] });
      }
    }
  });
}
