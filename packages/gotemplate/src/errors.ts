// Adapted from promptctl/go-template-js (MIT), commit 5cf0a74.
// See VENDOR.md for the licence and what we changed.
/**
 * The one error the parser raises.
 *
 * Upstream had a whole hierarchy here covering evaluation failures too --
 * missing fields, unregistered functions, argument type mismatches. We never
 * run templates, so none of that applied and it has been removed; see
 * VENDOR.md.
 */

import type { Pos } from './pos';

interface ParseErrorContext {
  readonly source?: string | undefined;
  /** What the parser wanted to see here, when it knows. */
  readonly expected?: string;
  /** What it found instead. */
  readonly found?: string;
}

export class ParseError extends Error {
  override readonly name = 'ParseError';
  readonly pos: Pos;
  readonly source: string | undefined;
  readonly expected: string | undefined;
  readonly found: string | undefined;

  constructor(message: string, pos: Pos, ctx: ParseErrorContext = {}) {
    super(message);
    this.pos = pos;
    this.source = ctx.source;
    this.expected = ctx.expected;
    this.found = ctx.found;
  }

  /** The offending line with its neighbours and a caret under the spot. */
  get sourceSnippet(): string {
    return this.source ? buildSnippet(this.source, this.pos) : '';
  }

  override toString(): string {
    const head = `${this.name}: ${this.message}\n  at line ${this.pos.line}, column ${this.pos.column}`;
    const snippet = this.sourceSnippet;
    return snippet ? `${head}\n\n${snippet}` : head;
  }
}

function buildSnippet(source: string, pos: Pos): string {
  const lines = source.split('\n');
  const lineIdx = pos.line - 1;

  const display: Array<{ num: number; text: string }> = [];
  if (lineIdx - 1 >= 0 && lineIdx - 1 < lines.length) {
    display.push({ num: lineIdx, text: lines[lineIdx - 1] ?? '' });
  }
  if (lineIdx >= 0 && lineIdx < lines.length) {
    display.push({ num: lineIdx + 1, text: lines[lineIdx] ?? '' });
  }
  if (lineIdx + 1 < lines.length) {
    display.push({ num: lineIdx + 2, text: lines[lineIdx + 1] ?? '' });
  }
  if (display.length === 0) {
    return '';
  }

  const numWidth = String(display[display.length - 1]?.num ?? 1).length;
  const out: string[] = [];
  for (const d of display) {
    out.push(`   ${String(d.num).padStart(numWidth, ' ')} | ${d.text}`);
    if (d.num === pos.line) {
      const gutter = `   ${' '.repeat(numWidth)} | `;
      out.push(`${gutter}${' '.repeat(Math.max(0, pos.column - 1))}^`);
    }
  }
  return out.join('\n');
}
