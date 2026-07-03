import React, { useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { t, Trans } from '@grafana/i18n';
import { Button, Field, Input, Stack, CodeEditor } from '@grafana/ui';
import { Template } from '../hooks/useTemplates';

export interface TemplateFormValues {
  title: string;
  content: string;
}

interface TemplateEditFormProps {
  template?: Template;
  existingTemplateNames: string[];
  onSave: (values: TemplateFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TemplateEditForm({
  template,
  existingTemplateNames,
  onSave,
  onCancel,
  isLoading = false,
}: TemplateEditFormProps) {
  const isEditMode = Boolean(template);
  const originalName = template?.name;

  const defaultValues = useMemo((): TemplateFormValues => {
    if (template) {
      return {
        title: template.name,
        content: template.content,
      };
    }
    return {
      title: '',
      content: '{{ define "my-template" }}\n  \n{{ end }}',
    };
  }, [template]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormValues>({
    defaultValues,
    mode: 'onBlur',
  });

  const onSubmit = useCallback(
    async (values: TemplateFormValues) => {
      await onSave(values);
    },
    [onSave]
  );

  const isNameUnique = useCallback(
    (name: string) => {
      // If editing and name hasn't changed, it's valid
      if (originalName && name === originalName) {
        return true;
      }
      return !existingTemplateNames.includes(name);
    },
    [existingTemplateNames, originalName]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack direction="column" gap={3}>
        {/* Template Name */}
        <Field
          label={t('templates.form.name', 'Name')}
          invalid={Boolean(errors.title)}
          error={errors.title?.message}
          required
        >
          <Input
            {...register('title', {
              required: t('templates.form.name-required', 'Template name is required'),
              validate: (value) => {
                if (!isNameUnique(value)) {
                  return t('templates.form.name-duplicate', 'A template with this name already exists');
                }
                return true;
              },
            })}
            placeholder={t('templates.form.name-placeholder', 'e.g., slack-notification.tmpl')}
            aria-label={t('templates.form.name', 'Name')}
          />
        </Field>

        {/* Template Content */}
        <Field
          label={t('templates.form.content', 'Content')}
          description={t(
            'templates.form.content-description',
            'Use Go template syntax. The template should be wrapped in {{ define "name" }} ... {{ end }}'
          )}
          invalid={Boolean(errors.content)}
          error={errors.content?.message}
          required
        >
          <Controller
            name="content"
            control={control}
            rules={{
              required: t('templates.form.content-required', 'Template content is required'),
            }}
            render={({ field: { onChange, value } }) => (
              <CodeEditor
                value={value}
                language="go-html-template"
                height={300}
                showLineNumbers
                showMiniMap={false}
                onBlur={onChange}
                onSave={onChange}
              />
            )}
          />
        </Field>

        {/* Form Actions */}
        <Stack direction="row" gap={2} justifyContent="flex-end">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting || isLoading}>
            <Trans i18nKey="common.cancel">Cancel</Trans>
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || isLoading}>
            {isSubmitting || isLoading ? (
              <Trans i18nKey="common.saving">Saving...</Trans>
            ) : isEditMode ? (
              <Trans i18nKey="templates.form.update">Update template</Trans>
            ) : (
              <Trans i18nKey="templates.form.create">Create template</Trans>
            )}
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
