import { now } from 'lodash';

export interface TemplateFormValues {
  title: string;
  content: string;
}

// notification template content must be wrapped in {{ define "name" }} tag,
// but this is not obvious because user also has to provide name separately in the form.
// so if user does not manually add {{ define }} tag, we do it automatically
export function ensureDefine(templateName: string, templateContent: string): string {
  let content = templateContent.trim();
  if (!content.match(/\{\{\s*define/)) {
    const indentedContent = content
      .split('\n')
      .map((line) => '  ' + line)
      .join('\n');
    content = `{{ define "${templateName}" }}\n${indentedContent}\n{{ end }}`;
  }
  return content;
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
