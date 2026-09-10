// Adapted from promptctl/go-template-js (MIT), commit 5cf0a74.
// See VENDOR.md for the licence and what we changed.
/**
 * Source position for AST nodes.
 *
 * `line` and `column` are 1-indexed for human-readable error reporting.
 * `offset` is a 0-indexed byte offset into the source string for snippet
 * extraction and machine-precise spans.
 *
 * [LAW:one-source-of-truth] All AST nodes carry the same Pos shape — there
 * is exactly one canonical position type, never per-node ad-hoc shapes.
 */
export interface Pos {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
}

export function pos(line: number, column: number, offset: number): Pos {
  return { line, column, offset };
}
