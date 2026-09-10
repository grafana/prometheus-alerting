import { z } from 'zod';
import { t } from '@grafana/i18n';
import { validateTemplateForSave } from '@grafana/go-template';

interface TemplateFormSchemaOptions {
  /** Names already taken by other templates. */
  existingTemplateNames: string[];
  /** The name this template had before editing, if we are editing one. */
  originalName?: string;
}

/**
 * This is a function rather than a module-level schema so the t() calls run
 * when the form renders instead of when the module loads, which is what the
 * i18n lint rule is after.
 */
export function createTemplateFormSchema({ existingTemplateNames, originalName }: TemplateFormSchemaOptions) {
  return z
    .object({
      title: z.string().min(1, t('templates.form.name-required', 'Template name is required')),
      content: z.string().min(1, t('templates.form.content-required', 'Template content is required')),
    })
    .superRefine((values, ctx) => {
      const isRenameCollision = values.title !== originalName && existingTemplateNames.includes(values.title);
      if (isRenameCollision) {
        ctx.addIssue({
          code: 'custom',
          message: t('templates.form.name-duplicate', 'A template with this name already exists'),
          path: ['title'],
        });
      }

      // Checked against the text that actually gets saved, which is the
      // content wrapped in {{ define }} when it doesn't already have one.
      const problem = validateTemplateForSave(values.title, values.content);
      if (problem) {
        ctx.addIssue({
          code: 'custom',
          // The detail is Go's own phrasing and stays untranslated: it is the
          // same wording Alertmanager would report, so it can be searched for.
          message: t('templates.form.content-invalid', 'Template syntax error on line {{line}}: {{detail}}', {
            line: problem.line,
            detail: problem.message,
          }),
          path: ['content'],
        });
      }
    });
}

export type TemplateFormSchema = z.infer<ReturnType<typeof createTemplateFormSchema>>;
