/** Matches a `{{ define }}` opening tag, however much space is inside the braces. */
const DEFINE_PATTERN = /\{\{\s*define/;

export interface WrappedTemplate {
  /** The text that will actually be saved. */
  text: string;
  /** How many lines were added above the original content. */
  lineOffset: number;
  /** How many characters were added to the start of each original line. */
  columnOffset: number;
}

/**
 * Notification template content has to sit inside a `{{ define "name" }}` tag,
 * but that isn't obvious from the edit form, which asks for the name in a
 * separate field. So if the content doesn't already have a define, we add one.
 *
 * The offsets matter because validation runs on the wrapped text: a problem the
 * parser reports on line 3 of the wrapped text is on line 2 of what the user
 * actually typed. Subtract these before showing a position to anyone.
 */
export function wrapTemplateForSave(templateName: string, templateContent: string): WrappedTemplate {
  const content = templateContent.trim();

  if (DEFINE_PATTERN.test(content)) {
    return { text: content, lineOffset: 0, columnOffset: 0 };
  }

  const indented = content
    .split('\n')
    .map((line) => '  ' + line)
    .join('\n');

  return {
    text: `{{ define "${templateName}" }}\n${indented}\n{{ end }}`,
    lineOffset: 1,
    columnOffset: 2,
  };
}
