import { now } from 'lodash';
import { wrapTemplateForSave } from '@grafana/go-template';

export interface TemplateFormValues {
  title: string;
  content: string;
}

// notification template content must be wrapped in {{ define "name" }} tag,
// but this is not obvious because user also has to provide name separately in the form.
// so if user does not manually add {{ define }} tag, we do it automatically
//
// The wrapping itself lives in @grafana/go-template because the form validates
// the wrapped text -- it has to check the same string that gets saved, and it
// needs to know how far the wrapping shifted the line and column numbers.
export function ensureDefine(templateName: string, templateContent: string): string {
  return wrapTemplateForSave(templateName, templateContent).text;
}

/**
 * Updates all {{ define }} tags in the template content by appending a unique timestamp suffix to their names.
 * Used to create unique template names when duplicating or versioning templates.
 *
 * @param templateContent - The template content containing {{ define }} tags
 * @returns The template content with updated define names
 *
 * @example
 * updateDefinesWithUniqueValue('{{ define "alert" }}\nContent\n{{ end }}')
 * // Returns: '{{ define "alert_NEW_1234567890" }}\nContent\n{{ end }}'
 */
export function updateDefinesWithUniqueValue(templateContent: string): string {
  const getNewValue = (_match: string, originalDefineName: string) => {
    return `{{ define "${originalDefineName}_COPY_${now()}" }}`;
  };
  return templateContent.replace(/\{\{\s*define\s*\"(?<defineName>.*)\"\s*\}\}/g, getNewValue);
}
