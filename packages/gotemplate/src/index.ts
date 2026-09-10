import { ParseError } from './errors';
import { parse } from './parser';
import { wrapTemplateForSave } from './wrap';

export { ParseError } from './errors';
export type { Pos } from './pos';
export { wrapTemplateForSave } from './wrap';
export type { WrappedTemplate } from './wrap';

export interface TemplateProblem {
  /** Human-readable description of what went wrong. */
  message: string;
  /** 1-based line the problem sits on. */
  line: number;
  /** 1-based column, counted in the same units the editor uses. */
  column: number;
}

/**
 * Parses a Go template the way Alertmanager would, and reports the first thing
 * that stops it from parsing. Returns undefined when the template is fine.
 *
 * This only checks that the template *parses*. It does not run it, so it can't
 * tell you whether the fields you reference (`.Alerts`, `.CommonLabels`, ...)
 * actually exist -- Go can't tell you that at parse time either.
 */
export function validateTemplate(source: string): TemplateProblem | undefined {
  try {
    parse(source);
    return undefined;
  } catch (error) {
    if (error instanceof ParseError) {
      return {
        message: error.message,
        line: error.pos.line,
        column: error.pos.column,
      };
    }
    // Anything else is a bug in the parser rather than a problem with the
    // template. Don't block the user on it; let it surface where it can be
    // seen and fixed.
    throw error;
  }
}

/**
 * Validates a template as it will be stored, and reports any problem against
 * what the author actually typed.
 *
 * Content without a `{{ define }}` gets wrapped before being saved, so the
 * text that has to parse is not the text in the editor. Positions come back
 * shifted into the editor's coordinates, so line 1 means the first line the
 * author sees.
 */
export function validateTemplateForSave(templateName: string, templateContent: string): TemplateProblem | undefined {
  const wrapped = wrapTemplateForSave(templateName, templateContent);
  const problem = validateTemplate(wrapped.text);
  if (!problem) {
    return undefined;
  }

  // The wrapping adds a `{{ define }}` line above the content and an
  // `{{ end }}` below it, and a problem can land on either of those -- lines
  // the author never wrote and cannot see. Pin those to the nearest line that
  // is theirs, so the position always points somewhere real in the editor.
  const authorLineCount = templateContent.trim().split('\n').length;
  const line = clamp(problem.line - wrapped.lineOffset, 1, authorLineCount);

  // Only the author's own lines were indented, so a column is worth shifting
  // only when the problem really is on one of them.
  const onAuthorLine = problem.line - wrapped.lineOffset === line;
  const column = onAuthorLine ? problem.column - wrapped.columnOffset : problem.column;

  return { message: problem.message, line, column: Math.max(1, column) };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
