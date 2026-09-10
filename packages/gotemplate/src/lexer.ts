// Adapted from promptctl/go-template-js (MIT), commit 5cf0a74.
// See VENDOR.md for the licence and what we changed.
/**
 * Lexer for Go-template syntax.
 *
 * Mirrors the tokens that text/template/parse/lex.go produces. The lexer
 * is a pull-style state machine — call `next()` to consume the next
 * token, `peek()` to look without consuming. EOF is emitted explicitly
 * as a terminal token.
 *
 * The state of the lexer is captured in
 * a single `mode` discriminator (`text` | `action` | `done`), and the
 * `next()` method dispatches on that mode in one switch. Variability
 * lives in the data (current offset, current mode), not in scattered
 * conditional code paths around side effects.
 *
 * All position tracking happens through `advance`.
 * Callers never adjust `offset`, `line`, or `column` directly — that
 * would let line/column drift from offset.
 */

import { ParseError } from './errors';
import type { Pos } from './pos';

// ---------------------------------------------------------------------------
// Tokens.
// ---------------------------------------------------------------------------

export type TokenType =
  | 'Text'
  | 'LeftDelim'
  | 'RightDelim'
  | 'Comment'
  | 'Identifier'
  | 'Field'
  | 'Variable'
  | 'String'
  | 'Number'
  | 'Char'
  | 'Bool'
  | 'Nil'
  | 'Dot'
  | 'LeftParen'
  | 'RightParen'
  | 'Pipe'
  | 'Assign'
  | 'Declare'
  | 'Comma'
  | 'If'
  | 'Else'
  | 'End'
  | 'Range'
  | 'With'
  | 'Break'
  | 'Continue'
  | 'Define'
  | 'Template'
  | 'Block'
  | 'EOF';

export interface Token {
  readonly type: TokenType;
  /** Original source text covered by the token (raw — quotes/dots/etc preserved). */
  readonly value: string;
  readonly pos: Pos;
  /** Set on LeftDelim when the source had `{{-`. */
  readonly trimLeft?: boolean;
  /** Set on RightDelim when the source had `-}}`. */
  readonly trimRight?: boolean;
}

const KEYWORDS = new Map<string, TokenType>([
  ['if', 'If'],
  ['else', 'Else'],
  ['end', 'End'],
  ['range', 'Range'],
  ['with', 'With'],
  ['break', 'Break'],
  ['continue', 'Continue'],
  ['define', 'Define'],
  ['template', 'Template'],
  ['block', 'Block'],
  ['true', 'Bool'],
  ['false', 'Bool'],
  ['nil', 'Nil'],
]);

/**
 * Action delimiters. Default is Go's `{{` / `}}`. Trim-marker forms are
 * derived mechanically: `<left>-` opens with-trim and `-<right>` closes
 * with-trim, matching Go's `text/template`.
 *
 * Both sides are required if specified —
 * neither may be empty. This is a stronger theorem than Go's API
 * (which lets one side default while the other is set) and forbids
 * the half-configured state that would otherwise have to be defended
 * against at every internal use site.
 */
export interface Delims {
  readonly left: string;
  readonly right: string;
}

const DEFAULT_DELIMS: Delims = { left: '{{', right: '}}' };

const COMMENT_OPEN = '/*';
const COMMENT_CLOSE = '*/';

// ---------------------------------------------------------------------------
// Lexer.
// ---------------------------------------------------------------------------

type Mode = 'text' | 'action' | 'done';

export class Lexer {
  private readonly src: string;
  // Delims are data, not modes. Lifting
  // them from module-level constants to instance fields adds no
  // branches — the existing state machine reads its delimiter strings
  // from these fields instead of from compile-time constants.
  private readonly leftDelim: string;
  private readonly rightDelim: string;
  private offset = 0;
  private line = 1;
  private column = 1;
  private mode: Mode = 'text';
  private pending: Token | undefined;

  constructor(src: string, delims: Delims = DEFAULT_DELIMS) {
    this.src = src;
    this.leftDelim = delims.left;
    this.rightDelim = delims.right;
  }

  /** Position of the next byte to consume. */
  pos(): Pos {
    return { line: this.line, column: this.column, offset: this.offset };
  }

  /**
   * Build a ParseError that always carries the source for snippet
   * extraction. Lexer call sites use this exclusively.
   */
  private err(message: string, pos: Pos, extra: { expected?: string; found?: string } = {}): ParseError {
    return new ParseError(message, pos, { ...extra, source: this.src });
  }

  next(): Token {
    if (this.pending) {
      const t = this.pending;
      this.pending = undefined;
      return t;
    }
    return this.read();
  }

  peek(): Token {
    if (!this.pending) {
      this.pending = this.read();
    }
    return this.pending;
  }

  private read(): Token {
    switch (this.mode) {
      case 'text':
        return this.readText();
      case 'action':
        return this.readAction();
      case 'done':
        return this.makeToken('EOF', '', this.pos());
    }
  }

  // ---------------------------------------------------------------------
  // TEXT mode — accumulate characters until a `{{` or EOF.
  //
  // Trim markers complicate this: a `{{-` token instructs the *previous*
  // text token to drop trailing whitespace. We resolve this by peeking
  // for `-` after the opening delimiter and trimming the captured text
  // before emitting it.
  // ---------------------------------------------------------------------
  private readText(): Token {
    if (this.offset >= this.src.length) {
      this.mode = 'done';
      return this.makeToken('EOF', '', this.pos());
    }
    const startPos = this.pos();

    // Find next `<leftDelim>` or EOF.
    let end = this.offset;
    while (end < this.src.length && !this.src.startsWith(this.leftDelim, end)) {
      end += 1;
    }

    // Detect trim marker on the upcoming delim.
    const sawDelim = end < this.src.length;
    const trimLeft = sawDelim && this.src[end + this.leftDelim.length] === '-';

    // If `{{-`, strip trailing ASCII whitespace from the captured text.
    let textEnd = end;
    if (trimLeft) {
      while (textEnd > this.offset && isSpace(this.src[textEnd - 1] ?? '')) {
        textEnd -= 1;
      }
    }

    if (textEnd > this.offset) {
      const value = this.src.slice(this.offset, textEnd);
      this.advanceTo(textEnd);
      return this.makeToken('Text', value, startPos);
    }

    // No text content — there may still be whitespace between us and
    // the delim (already trimmed away from the previous Text token).
    // Skip it before emitting the delim so position bookkeeping stays
    // synchronised.
    this.advanceTo(end);
    return this.emitLeftDelim(trimLeft);
  }

  private emitLeftDelim(trimLeft: boolean): Token {
    const start = this.pos();
    this.advanceBy(this.leftDelim.length);
    if (trimLeft) {
      // skip the `-`
      this.advanceBy(1);
      // skip the whitespace right after `<left>-` per Go's spec
      while (isSpace(this.src[this.offset] ?? '')) {
        this.advanceBy(1);
      }
    }
    this.mode = 'action';

    // Comment handling: if the next chars are `/*`, consume until `*/<right>`
    // and emit a Comment token instead of a LeftDelim.
    if (this.src.startsWith(COMMENT_OPEN, this.offset)) {
      return this.readComment(start, trimLeft);
    }

    return this.makeToken(
      'LeftDelim',
      trimLeft ? `${this.leftDelim}-` : this.leftDelim,
      start,
      trimLeft ? { trimLeft: true } : {}
    );
  }

  private readComment(startDelim: Pos, trimLeft: boolean): Token {
    this.advanceBy(COMMENT_OPEN.length);
    const bodyStart = this.offset;
    const closeIdx = this.src.indexOf(COMMENT_CLOSE, this.offset);
    if (closeIdx === -1) {
      throw this.err('unclosed comment', startDelim, {
        expected: `*/${this.rightDelim}`,
        found: 'end of input',
      });
    }
    // Advance through body
    this.advanceTo(closeIdx);
    const body = this.src.slice(bodyStart, closeIdx).trim();
    this.advanceBy(COMMENT_CLOSE.length);

    // Optional whitespace between `*/` and the closing `<right>` / `-<right>`.
    // Go's spec says `-<right>` requires *adjacent* whitespace; we accept
    // either `*/ -<right>`, `*/-<right>`, `*/ <right>`, or `*/<right>` for
    // forgiveness.
    while (isSpace(this.src[this.offset] ?? '')) {
      this.advanceBy(1);
    }
    let trimRight = false;
    if (this.src[this.offset] === '-') {
      trimRight = true;
      this.advanceBy(1);
    }
    if (!this.src.startsWith(this.rightDelim, this.offset)) {
      throw this.err(`expected \`${this.rightDelim}\` to close comment`, this.pos(), {
        expected: this.rightDelim,
        found: this.src[this.offset] ?? 'end of input',
      });
    }
    this.advanceBy(this.rightDelim.length);
    // After comment body close, drop trailing whitespace from upcoming
    // text if `-}}` was used. Implement by skipping forward in text now.
    if (trimRight) {
      while (isSpace(this.src[this.offset] ?? '')) {
        this.advanceBy(1);
      }
    }
    this.mode = 'text';

    // Comment carries its own trim flags so the parser can preserve
    // them in the AST. Omit unset flags entirely (per
    // exactOptionalPropertyTypes).
    return this.makeToken('Comment', body, startDelim, {
      ...(trimLeft ? { trimLeft: true } : {}),
      ...(trimRight ? { trimRight: true } : {}),
    });
  }

  // ---------------------------------------------------------------------
  // ACTION mode — operators, identifiers, literals.
  // ---------------------------------------------------------------------
  private readAction(): Token {
    this.skipActionSpaces();

    // Right delim? Check `-<right>` *first* — otherwise a delim like
    // `}}` would match the bare form before the trim-form is considered.
    if (this.src.startsWith(`-${this.rightDelim}`, this.offset)) {
      const start = this.pos();
      this.advanceBy(1 + this.rightDelim.length);
      this.mode = 'text';
      // strip leading whitespace from upcoming text
      while (isSpace(this.src[this.offset] ?? '')) {
        this.advanceBy(1);
      }
      return this.makeToken('RightDelim', `-${this.rightDelim}`, start, { trimRight: true });
    }
    if (this.src.startsWith(this.rightDelim, this.offset)) {
      const start = this.pos();
      this.advanceBy(this.rightDelim.length);
      this.mode = 'text';
      return this.makeToken('RightDelim', this.rightDelim, start);
    }

    if (this.offset >= this.src.length) {
      throw this.err('unclosed action', this.pos(), {
        expected: this.rightDelim,
        found: 'end of input',
      });
    }

    // Whole character, so that an astral character reads as itself rather than
    // as a stray surrogate half -- both for the identifier check below and for
    // the "unexpected character" message.
    const ch = this.offset < this.src.length ? this.wholeCharAt(this.offset) : undefined;
    const start = this.pos();

    // Punctuation.
    switch (ch) {
      case '(':
        this.advanceBy(1);
        return this.makeToken('LeftParen', '(', start);
      case ')':
        this.advanceBy(1);
        return this.makeToken('RightParen', ')', start);
      case '|':
        this.advanceBy(1);
        return this.makeToken('Pipe', '|', start);
      case ',':
        this.advanceBy(1);
        return this.makeToken('Comma', ',', start);
      case ':':
        if (this.src[this.offset + 1] === '=') {
          this.advanceBy(2);
          return this.makeToken('Declare', ':=', start);
        }
        throw this.err('expected `:=`', start, { expected: ':=', found: ':' });
      case '=':
        this.advanceBy(1);
        return this.makeToken('Assign', '=', start);
      case '"':
        return this.readQuotedString(start);
      case '`':
        return this.readRawString(start);
      case "'":
        return this.readChar(start);
    }

    // Variable: $name or $ alone.
    if (ch === '$') {
      return this.readVariable(start);
    }

    // Number — possibly signed. Go template numbers can begin with +/-.
    if (
      ch !== undefined &&
      (isDigit(ch) ||
        (isSign(ch) && isDigit(this.src[this.offset + 1] ?? '')) ||
        (ch === '.' && isDigit(this.src[this.offset + 1] ?? '')))
    ) {
      return this.readNumber(start);
    }

    // Field: `.name` or bare `.`
    if (ch === '.') {
      return this.readDotOrField(start);
    }

    // Identifier / keyword.
    if (ch !== undefined && isIdentStart(ch)) {
      return this.readIdentifier(start);
    }

    throw this.err(`unexpected character ${JSON.stringify(ch)}`, start, {
      found: ch ?? 'end of input',
    });
  }

  // ---------------------------------------------------------------------
  // Literals + identifiers.
  // ---------------------------------------------------------------------

  private readQuotedString(start: Pos): Token {
    const startOffset = this.offset;
    this.advanceBy(1);
    while (this.offset < this.src.length) {
      const c = this.src[this.offset];
      if (c === '\\') {
        // Skip escape sequence (consume the next char, no decoding here).
        this.advanceBy(1);
        if (this.offset < this.src.length) {
          this.advanceBy(1);
        }
        continue;
      }
      if (c === '\n') {
        throw this.err('newline in interpreted string', start, {
          found: '\\n',
        });
      }
      if (c === '"') {
        this.advanceBy(1);
        return this.makeToken('String', this.src.slice(startOffset, this.offset), start);
      }
      this.advanceBy(1);
    }
    throw this.err('unterminated string literal', start, {
      expected: '"',
      found: 'end of input',
    });
  }

  private readRawString(start: Pos): Token {
    const startOffset = this.offset;
    this.advanceBy(1);
    while (this.offset < this.src.length) {
      if (this.src[this.offset] === '`') {
        this.advanceBy(1);
        return this.makeToken('String', this.src.slice(startOffset, this.offset), start);
      }
      this.advanceBy(1);
    }
    throw this.err('unterminated raw string literal', start, {
      expected: '`',
      found: 'end of input',
    });
  }

  private readChar(start: Pos): Token {
    const startOffset = this.offset;
    this.advanceBy(1);
    while (this.offset < this.src.length) {
      const c = this.src[this.offset];
      if (c === '\\') {
        this.advanceBy(1);
        if (this.offset < this.src.length) {
          this.advanceBy(1);
        }
        continue;
      }
      if (c === '\n') {
        throw this.err('newline in rune literal', start, { found: '\\n' });
      }
      if (c === "'") {
        this.advanceBy(1);
        return this.makeToken('Char', this.src.slice(startOffset, this.offset), start);
      }
      this.advanceBy(1);
    }
    throw this.err('unterminated rune literal', start, {
      expected: "'",
      found: 'end of input',
    });
  }

  private readNumber(start: Pos): Token {
    const startOffset = this.offset;
    // Optional sign.
    if (isSign(this.src[this.offset] ?? '')) {
      this.advanceBy(1);
    }
    // Detect base prefix.
    if (this.src[this.offset] === '0' && this.offset + 1 < this.src.length) {
      const next = this.src[this.offset + 1];
      if (next === 'x' || next === 'X') {
        this.advanceBy(2);
        while (isHex(this.src[this.offset] ?? '') || this.src[this.offset] === '_') {
          this.advanceBy(1);
        }
        // hex float (1.0p1) — Go supports it; we accept the form lazily
        if (this.src[this.offset] === '.' || this.src[this.offset] === 'p' || this.src[this.offset] === 'P') {
          while (this.isHexFloatTail(this.src[this.offset] ?? '')) {
            this.advanceBy(1);
          }
        }
        return this.finishNumber(startOffset, start);
      }
      if (next === 'o' || next === 'O') {
        this.advanceBy(2);
        while (isOctal(this.src[this.offset] ?? '') || this.src[this.offset] === '_') {
          this.advanceBy(1);
        }
        return this.finishNumber(startOffset, start);
      }
      if (next === 'b' || next === 'B') {
        this.advanceBy(2);
        while (isBinary(this.src[this.offset] ?? '') || this.src[this.offset] === '_') {
          this.advanceBy(1);
        }
        return this.finishNumber(startOffset, start);
      }
    }

    // Decimal / float.
    while (isDigit(this.src[this.offset] ?? '') || this.src[this.offset] === '_') {
      this.advanceBy(1);
    }
    if (this.src[this.offset] === '.') {
      this.advanceBy(1);
      while (isDigit(this.src[this.offset] ?? '') || this.src[this.offset] === '_') {
        this.advanceBy(1);
      }
    }
    if (this.src[this.offset] === 'e' || this.src[this.offset] === 'E') {
      this.advanceBy(1);
      if (isSign(this.src[this.offset] ?? '')) {
        this.advanceBy(1);
      }
      while (isDigit(this.src[this.offset] ?? '')) {
        this.advanceBy(1);
      }
    }
    // Imaginary suffix.
    if (this.src[this.offset] === 'i') {
      this.advanceBy(1);
    }
    return this.finishNumber(startOffset, start);
  }

  private isHexFloatTail(c: string): boolean {
    return isHex(c) || c === '.' || c === 'p' || c === 'P' || c === '+' || c === '-' || c === '_';
  }

  private finishNumber(startOffset: number, start: Pos): Token {
    if (this.offset === startOffset) {
      throw this.err('expected number', start, { expected: 'digit' });
    }
    return this.makeToken('Number', this.src.slice(startOffset, this.offset), start);
  }

  /**
   * Reads the whole character at an offset rather than half of one.
   * JavaScript strings are UTF-16, so a character outside the basic plane --
   * an astral character like `𝕏` -- occupies two slots, and reading a single
   * slot hands you an unusable half. Go's lexer works in whole characters, so
   * a field name like `.𝕏` has to be read the same way here.
   */
  private wholeCharAt(offset: number): string {
    const code = this.src.codePointAt(offset);
    return code === undefined ? '' : String.fromCodePoint(code);
  }

  /** Advances past a run of identifier characters, a whole character at a time. */
  private skipIdentChars(): void {
    for (;;) {
      const ch = this.wholeCharAt(this.offset);
      if (ch === '' || !isIdentPart(ch)) {
        return;
      }
      this.advanceBy(ch.length);
    }
  }

  private readVariable(start: Pos): Token {
    const startOffset = this.offset;
    this.advanceBy(1); // $
    this.skipIdentChars();
    // Field accesses appended to a variable form a Variable token whose
    // value is the full `$name.x.y` chain. The parser splits this back
    // into VariableNode.idents.
    while (this.src[this.offset] === '.' && isIdentStart(this.wholeCharAt(this.offset + 1))) {
      this.advanceBy(1); // .
      this.skipIdentChars();
    }
    return this.makeToken('Variable', this.src.slice(startOffset, this.offset), start);
  }

  private readDotOrField(start: Pos): Token {
    const startOffset = this.offset;
    this.advanceBy(1); // .
    if (!isIdentStart(this.wholeCharAt(this.offset))) {
      return this.makeToken('Dot', '.', start);
    }
    this.skipIdentChars();
    while (this.src[this.offset] === '.' && isIdentStart(this.wholeCharAt(this.offset + 1))) {
      this.advanceBy(1); // .
      this.skipIdentChars();
    }
    return this.makeToken('Field', this.src.slice(startOffset, this.offset), start);
  }

  private readIdentifier(start: Pos): Token {
    const startOffset = this.offset;
    this.skipIdentChars();
    const text = this.src.slice(startOffset, this.offset);
    const kw = KEYWORDS.get(text);
    if (kw) {
      return this.makeToken(kw, text, start);
    }
    return this.makeToken('Identifier', text, start);
  }

  // ---------------------------------------------------------------------
  // Position and dispatch helpers.
  // ---------------------------------------------------------------------

  private skipActionSpaces(): void {
    while (this.offset < this.src.length) {
      const c = this.src[this.offset];
      if (c === ' ' || c === '\t' || c === '\r' || c === '\n') {
        this.advanceBy(1);
      } else {
        return;
      }
    }
  }

  private advanceBy(n: number): void {
    for (let i = 0; i < n; i++) {
      const c = this.src[this.offset];
      this.offset += 1;
      if (c === '\n') {
        this.line += 1;
        this.column = 1;
      } else {
        this.column += 1;
      }
    }
  }

  private advanceTo(target: number): void {
    while (this.offset < target) {
      this.advanceBy(1);
    }
  }

  private makeToken(
    type: TokenType,
    value: string,
    pos: Pos,
    extra: { trimLeft?: boolean; trimRight?: boolean } = {}
  ): Token {
    return Object.freeze({
      type,
      value,
      pos,
      ...(extra.trimLeft !== undefined ? { trimLeft: extra.trimLeft } : {}),
      ...(extra.trimRight !== undefined ? { trimRight: extra.trimRight } : {}),
    });
  }
}

// ---------------------------------------------------------------------------
// Character class predicates — small + inlinable.
// ---------------------------------------------------------------------------

function isSpace(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\r' || c === '\n';
}

function isSign(c: string): boolean {
  return c === '+' || c === '-';
}

function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}

function isHex(c: string): boolean {
  return isDigit(c) || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
}

function isOctal(c: string): boolean {
  return c >= '0' && c <= '7';
}

function isBinary(c: string): boolean {
  return c === '0' || c === '1';
}

// Go's lexer treats anything unicode.IsLetter accepts as a letter and anything
// unicode.IsDigit accepts as a digit, so `{{ .Ünïcødé }}` and `{{ .日本 }}` are
// valid field names. \p{L} and \p{Nd} are the same two categories. ASCII is
// checked first because that is nearly every template.
const UNICODE_LETTER = /\p{L}/u;
const UNICODE_DIGIT = /\p{Nd}/u;

function isLetter(c: string): boolean {
  if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
    return true;
  }
  return c.length > 0 && c.charCodeAt(0) > 0x7f && UNICODE_LETTER.test(c);
}

function isIdentStart(c: string): boolean {
  return isLetter(c) || c === '_';
}

function isIdentPart(c: string): boolean {
  if (isIdentStart(c) || isDigit(c)) {
    return true;
  }
  return c.length > 0 && c.charCodeAt(0) > 0x7f && UNICODE_DIGIT.test(c);
}
