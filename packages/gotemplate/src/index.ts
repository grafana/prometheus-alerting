import { ParseError } from './errors';
import { parse } from './parser';

export { ParseError } from './errors';
export type { Pos } from './pos';

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
