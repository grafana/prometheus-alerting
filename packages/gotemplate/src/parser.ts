// Adapted from promptctl/go-template-js (MIT), commit 5cf0a74.
// See VENDOR.md for the licence and what we changed.
/**
 * Recursive-descent parser for Go-template syntax.
 *
 * The parser is a single class whose
 * methods read the token stream and emit AST nodes. There are no
 * conditional code paths that produce *different program structure* —
 * every grammar production is one method whose shape is fixed; the
 * variability is in the token values it observes.
 *
 * All token consumption goes through `next` /
 * `peek` / `expect`. No grammar production reaches into the lexer
 * directly — that would let two productions disagree about position
 * tracking or lookahead state.
 */

import type {
  ActionNode,
  BlockNode,
  BoolNode,
  BreakNode,
  ChainNode,
  CommandNode,
  CommentNode,
  ContinueNode,
  DotNode,
  FieldNode,
  IdentifierNode,
  IfNode,
  ListNode,
  NilNode,
  Node,
  NumberNode,
  PipeNode,
  RangeNode,
  StringNode,
  TemplateNode,
  TextNode,
  TrimMarkers,
  VariableNode,
  WithNode,
} from './ast';
import { ParseError } from './errors';
import { type Delims, Lexer, type Token, type TokenType } from './lexer';
import type { Pos } from './pos';

// ---------------------------------------------------------------------------
// Public API.
// ---------------------------------------------------------------------------

/**
 * A named sub-template body together with the source it was parsed from.
 * A body invoked through an inherited `Defines` runs far from the template
 * that invoked it, so an error inside it must snippet against ITS source,
 * not the invoker's.
 */
export interface DefineEntry {
  readonly list: ListNode;
  readonly source: string;
}

/**
 * The named sub-templates a template can invoke: the ones its own source
 * declared plus, transitively, the ones it inherited at parse. Opaque: only
 * `has` and the `EMPTY` identity are public, so a consumer can neither build
 * one by hand (the parser is the single enforcer of the redefinition invariant
 * below) nor reach the AST inside — the entry lookup is `lookupDefine`, a
 * module export index.ts never re-exports.
 *
 * Inheritance is a parent LINK, never a copy. N
 * templates parsed against one shared preamble hold one preamble AST among
 * them — the alternative (prepending the preamble's source to each parse)
 * multiplies the preamble's AST by N, which is how a 2 KB helper block became
 * hundreds of megabytes in a long-lived process.
 *
 * Lookup is nearest-first, but the parser forbids a template from declaring a
 * name its inherited set already holds (the same `redefinition` error as two
 * declarations in one source), so nearest-first never actually shadows.
 */
// The parser is the only place a Defines is built
// and lookupDefine the only reader of its entries — both captured from the
// static block below, the same way Engine reaches Template's private
// constructor — so the public surface carries neither a constructor nor an
// AST-returning method.
let chainDefines: (own: ReadonlyMap<string, DefineEntry>, parent: Defines) => Defines;
let readDefine: (defines: Defines, name: string) => DefineEntry | undefined;

/** Nearest-first entry lookup through the inheritance chain. Package-internal. */
export function lookupDefine(defines: Defines, name: string): DefineEntry | undefined {
  return readDefine(defines, name);
}

export class Defines {
  static readonly EMPTY = new Defines(new Map(), undefined);
  // Plain private fields rather than `#private` ones: this repo compiles to a
  // target where `#` fields need a tslib helper that isn't installed.
  private readonly own: ReadonlyMap<string, DefineEntry>;
  private readonly parent: Defines | undefined;

  private constructor(own: ReadonlyMap<string, DefineEntry>, parent: Defines | undefined) {
    this.own = own;
    this.parent = parent;
  }

  static {
    chainDefines = (own, parent) => new Defines(own, parent);
    readDefine = (d, name) => d.own.get(name) ?? (d.parent && readDefine(d.parent, name));
  }

  has(name: string): boolean {
    return readDefine(this, name) !== undefined;
  }
}

export interface ParseResult {
  /** The body of the unnamed/root template. */
  readonly root: ListNode;
  /**
   * Templates this parse can invoke: its own (`ownDefines`) chained onto the
   * inherited set it was parsed against.
   */
  readonly defines: Defines;
  /**
   * The sub-templates this source itself declared, by `{{define "name"}}` /
   * `{{block}}` — what static introspection describes; the inherited set is
   * described by the parse that declared it.
   */
  readonly ownDefines: ReadonlyMap<string, DefineEntry>;
  /** Original source text — preserved for error snippets and Template.source. */
  readonly source: string;
}

export function parse(source: string, delims?: Delims, inherit: Defines = Defines.EMPTY): ParseResult {
  const parser = new Parser(source, delims, inherit);
  return parser.parseTemplate();
}

// ---------------------------------------------------------------------------
// Internals.
// ---------------------------------------------------------------------------

class Parser {
  private readonly lex: Lexer;
  private readonly buf: Token[] = [];
  private readonly defines = new Map<string, DefineEntry>();
  private readonly inherit: Defines;
  private readonly source: string;
  // Lexical-only counter: how many enclosing
  // `{{range}}` bodies surround the current parse position. `{{break}}`
  // and `{{continue}}` are legal iff this is > 0. Mirrors Go's
  // text/template/parse `Tree.rangeDepth`. Saved/restored around
  // sub-template bodies (`{{define}}` / `{{block}}`) because those
  // bodies are independent parse contexts in Go — a break lexically
  // inside a range but inside a nested define is still an error.
  private rangeDepth = 0;

  constructor(source: string, delims: Delims | undefined, inherit: Defines) {
    this.source = source;
    this.inherit = inherit;
    this.lex = delims ? new Lexer(source, delims) : new Lexer(source);
  }

  // -------------------------------------------------------------------
  // Token stream helpers.
  // -------------------------------------------------------------------

  private peek(n = 0): Token {
    while (this.buf.length <= n) {
      this.buf.push(this.lex.next());
    }
    // We just filled the buffer to n+1
    // entries, so buf[n] is non-undefined by construction. Cast rather
    // than guard — the alternative throw would be unreachable.
    return this.buf[n] as Token;
  }

  private next(): Token {
    if (this.buf.length > 0) {
      return this.buf.shift() as Token;
    }
    return this.lex.next();
  }

  private expect(type: TokenType, what: string): Token {
    const t = this.next();
    if (t.type !== type) {
      throw this.errAt(t, `expected ${what}`, { expected: what, found: tokenLabel(t) });
    }
    return t;
  }

  private errAt(t: Token, message: string, extra: { expected?: string; found?: string } = {}): ParseError {
    return new ParseError(message, t.pos, {
      ...extra,
      source: this.source,
    });
  }

  // -------------------------------------------------------------------
  // Top-level.
  // -------------------------------------------------------------------

  parseTemplate(): ParseResult {
    const root = this.parseList();
    if (this.peek().type !== 'EOF') {
      const left = this.peek();
      // We only stop in parseList for stray `{{else}}` or `{{end}}`.
      // Surface that as a curated message rather than the generic
      // "unexpected `{{`" we'd otherwise emit.
      const inside = this.peek(1);
      if (left.type === 'LeftDelim' && (inside.type === 'Else' || inside.type === 'End')) {
        const keyword = inside.type === 'Else' ? 'else' : 'end';
        throw this.errAt(left, `unexpected \`{{${keyword}}}\` outside of \`if\`, \`range\`, \`with\`, or \`block\``, {
          found: `{{${keyword}}}`,
        });
      }
      throw this.errAt(left, `unexpected ${tokenLabel(left)}`, { found: tokenLabel(left) });
    }
    return {
      root,
      defines: chainDefines(this.defines, this.inherit),
      ownDefines: this.defines,
      source: this.source,
    };
  }

  // -------------------------------------------------------------------
  // List body — runs until EOF or a branch terminator (else/end).
  // -------------------------------------------------------------------

  private parseList(): ListNode {
    const startPos = this.peek().pos;
    const nodes: Node[] = [];
    while (true) {
      const t = this.peek();
      if (t.type === 'EOF') {
        break;
      }
      if (t.type === 'Text') {
        this.next();
        nodes.push({ type: 'Text', pos: t.pos, text: t.value } satisfies TextNode);
        continue;
      }
      if (t.type === 'Comment') {
        this.next();
        const trim = trimFromToken(t);
        nodes.push({ type: 'Comment', pos: t.pos, text: t.value, trim } satisfies CommentNode);
        continue;
      }
      if (t.type === 'LeftDelim') {
        // Branch terminators stop the list without consuming the delim.
        const inside = this.peek(1).type;
        if (inside === 'Else' || inside === 'End') {
          return finishList(startPos, nodes);
        }
        const action = this.parseAction();
        if (action !== null) {
          nodes.push(action);
        }
        continue;
      }
      throw this.errAt(t, `unexpected ${tokenLabel(t)} at top level`, {
        found: tokenLabel(t),
      });
    }
    return finishList(startPos, nodes);
  }

  // -------------------------------------------------------------------
  // Action body — dispatched on the keyword right after `{{`.
  //
  // Returns null when the action consumed is a `{{define}}` block, since
  // defines are stashed in the parser's defines map rather than added to
  // the surrounding list.
  // -------------------------------------------------------------------

  private parseAction(): Node | null {
    const left = this.expect('LeftDelim', '`{{`');
    const trimLeft = left.trimLeft === true;
    const head = this.peek();

    switch (head.type) {
      case 'If':
        this.next();
        return this.parseBranch('If', left.pos, trimLeft);
      case 'Range':
        this.next();
        return this.parseBranch('Range', left.pos, trimLeft);
      case 'With':
        this.next();
        return this.parseBranch('With', left.pos, trimLeft);
      case 'Break':
        this.next();
        return this.parseBreakOrContinue('Break', left.pos, trimLeft);
      case 'Continue':
        this.next();
        return this.parseBreakOrContinue('Continue', left.pos, trimLeft);
      case 'Template':
        this.next();
        return this.parseTemplateInvocation(left.pos, trimLeft);
      case 'Block':
        this.next();
        return this.parseBlock(left.pos, trimLeft);
      case 'Define':
        this.next();
        this.parseDefine(left.pos, trimLeft);
        return null;
      case 'RightDelim':
        // Empty action `{{}}` is illegal in Go's parser.
        throw this.errAt(head, 'empty action', { expected: 'pipeline' });
      default: {
        // A plain pipeline action: `{{ pipeline }}`.
        const pipe = this.parsePipeline();
        const right = this.expect('RightDelim', '`}}`');
        return {
          type: 'Action',
          pos: left.pos,
          pipe,
          trim: { trimLeft, trimRight: right.trimRight === true },
        } satisfies ActionNode;
      }
    }
  }

  // -------------------------------------------------------------------
  // Branches: if / range / with.
  //
  // Shape: `{{if PIPE}} list ({{else if PIPE}} list)* ({{else}} list)? {{end}}`.
  // The `else if` chain is desugared into nested IfNodes inside the
  // outer if's elseList, matching Go's parse package.
  // -------------------------------------------------------------------

  private parseBranch(kind: 'If' | 'Range' | 'With', startPos: Pos, trimLeft: boolean): IfNode | RangeNode | WithNode {
    const pipe = this.parsePipeline();
    this.expect('RightDelim', '`}}`');
    // `rangeDepth` counts the enclosing
    // ranges that can absorb a `{{break}}` / `{{continue}}` at the
    // current parse position. A range's body contributes 1; a range's
    // else clause contributes 0 — the else only runs on empty input
    // and is structurally outside the iteration, so it cannot be the
    // *target* of a break aimed at its own range. Another enclosing
    // range is required for the signal to be catchable.
    //
    // Decrementing *before* parsing the else (not after parseElsePart)
    // matches Go's text/template parser exactly — see
    // text/template/parse/parse.go:540-547 — so a top-level
    // `{{range}}{{else}}{{break}}{{end}}` errors at parse time with
    // the same "{{break}} outside {{range}}" message Go emits.
    if (kind === 'Range') {
      this.rangeDepth += 1;
    }
    const list = this.parseList();
    if (kind === 'Range') {
      this.rangeDepth -= 1;
    }
    const elsePart = this.parseElsePart();
    const endRight = elsePart.endConsumed ? elsePart.endRight : this.consumeEnd();
    const trim: TrimMarkers = { trimLeft, trimRight: endRight };

    const base = elsePart.list ? { pipe, list, elseList: elsePart.list, trim } : { pipe, list, trim };
    switch (kind) {
      case 'If':
        return { type: 'If', pos: startPos, ...base } satisfies IfNode;
      case 'Range':
        return { type: 'Range', pos: startPos, ...base } satisfies RangeNode;
      case 'With':
        return { type: 'With', pos: startPos, ...base } satisfies WithNode;
    }
  }

  // -------------------------------------------------------------------
  // {{break}} / {{continue}} — range-body control flow.
  //
  // Both are leaves with only a position +
  // trim markers. The strongest theorem about them is that they carry
  // no value, no body, no pipeline — encode that in the type so the
  // body of every visitor is forced to treat them as leaves.
  //
  // The "must be inside a `{{range}}`" rule
  // lives here at the gate. Once the AST is built, a consumer
  // trusts the lexical guarantee — no runtime guard re-checks.
  // -------------------------------------------------------------------
  private parseBreakOrContinue(kind: 'Break' | 'Continue', startPos: Pos, trimLeft: boolean): BreakNode | ContinueNode {
    if (this.rangeDepth === 0) {
      const keyword = kind === 'Break' ? 'break' : 'continue';
      throw new ParseError(`{{${keyword}}} outside of {{range}}`, startPos, {
        source: this.source,
      });
    }
    const right = this.expect('RightDelim', '`}}`');
    const trim: TrimMarkers = { trimLeft, trimRight: right.trimRight === true };
    return kind === 'Break'
      ? ({ type: 'Break', pos: startPos, trim } satisfies BreakNode)
      : ({ type: 'Continue', pos: startPos, trim } satisfies ContinueNode);
  }

  /**
   * Parse the `{{else}}` / `{{else if PIPE}}` segment, if any.
   *
   * `else if` is desugared into a nested IfNode wrapped in the elseList.
   * The recursive parseBranch consumes the chain's single closing
   * `{{end}}`, so the outer caller must NOT consume another — hence the
   * `endConsumed` flag we propagate back.
   */
  private parseElsePart(): {
    list: ListNode | undefined;
    endRight: boolean;
    endConsumed: boolean;
  } {
    if (this.peek().type !== 'LeftDelim' || this.peek(1).type !== 'Else') {
      return { list: undefined, endRight: false, endConsumed: false };
    }
    const left = this.next(); // {{
    this.next(); // else
    // `{{else if}}` and `{{else with}}` both continue the chain: the nested
    // branch swallows the single closing `{{end}}`, so the caller must not
    // look for another one.
    const chained = this.peek().type;
    if (chained === 'If' || chained === 'With') {
      this.next(); // if / with
      const innerBranch = this.parseBranch(chained, left.pos, left.trimLeft === true);
      return {
        list: { type: 'List', pos: left.pos, nodes: [innerBranch] },
        endRight: innerBranch.trim.trimRight,
        endConsumed: true,
      };
    }
    this.expect('RightDelim', '`}}`');
    const list = this.parseList();
    return { list, endRight: false, endConsumed: false };
  }

  /** Consume the closing `{{end}}` and return whether it was a `-}}`. */
  private consumeEnd(): boolean {
    this.expect('LeftDelim', '`{{end}}`');
    this.expect('End', '`end`');
    const right = this.expect('RightDelim', '`}}`');
    return right.trimRight === true;
  }

  // -------------------------------------------------------------------
  // Sub-templates: template / block / define.
  // -------------------------------------------------------------------

  private parseTemplateInvocation(startPos: Pos, trimLeft: boolean): TemplateNode {
    const name = this.parseQuotedName();
    const pipe = this.peek().type === 'RightDelim' ? undefined : this.parsePipeline();
    const right = this.expect('RightDelim', '`}}`');
    const trim: TrimMarkers = { trimLeft, trimRight: right.trimRight === true };
    return pipe
      ? ({ type: 'Template', pos: startPos, name, pipe, trim } satisfies TemplateNode)
      : ({ type: 'Template', pos: startPos, name, trim } satisfies TemplateNode);
  }

  private parseBlock(startPos: Pos, trimLeft: boolean): BlockNode {
    const name = this.parseQuotedName();
    const pipe = this.peek().type === 'RightDelim' ? undefined : this.parsePipeline();
    this.expect('RightDelim', '`}}`');
    // A `{{block}}` body is invoked via the
    // sub-template machinery: a separate parse context in Go's
    // text/template. Save and reset rangeDepth so a `{{break}}` inside
    // a block body — even when the block is lexically nested in an
    // outer range — is correctly rejected at parse time.
    const savedDepth = this.rangeDepth;
    this.rangeDepth = 0;
    const list = this.parseList();
    this.rangeDepth = savedDepth;
    const endRight = this.consumeEnd();
    const trim: TrimMarkers = { trimLeft, trimRight: endRight };
    // Block both registers a default body under `name` AND invokes it.
    // A preceding `{{define}}` for the same name — in this source or in the
    // inherited set — takes precedence: the block body is the fallback, not
    // the override.
    if (!this.defines.has(name) && !this.inherit.has(name)) {
      this.defines.set(name, { list, source: this.source });
    }
    return pipe
      ? ({ type: 'Block', pos: startPos, name, pipe, list, trim } satisfies BlockNode)
      : ({ type: 'Block', pos: startPos, name, list, trim } satisfies BlockNode);
  }

  private parseDefine(_startPos: Pos, _trimLeft: boolean): void {
    const name = this.parseQuotedName();
    this.expect('RightDelim', '`}}`');
    // Defines are independent parse
    // contexts in Go's text/template — `{{break}}` inside a `{{define}}`
    // body is illegal even when the define is lexically nested inside
    // a range. Save and reset rangeDepth so the depth tracked here
    // reflects only ranges that lexically enclose this body.
    const savedDepth = this.rangeDepth;
    this.rangeDepth = 0;
    const list = this.parseList();
    this.rangeDepth = savedDepth;
    this.consumeEnd();
    // Go allows a later definition to replace an earlier one when either body
    // is effectively empty -- whitespace and comments only. Only two bodies
    // that both actually do something are a genuine clash. This matters here
    // because the edit form's default content is an empty
    // `{{ define "..." }}{{ end }}` shell.
    const existing = this.defines.get(name) ?? lookupDefine(this.inherit, name);
    if (existing !== undefined && !isEmptyTree(existing.list) && !isEmptyTree(list)) {
      throw new ParseError(`redefinition of template ${JSON.stringify(name)}`, list.pos, {
        source: this.source,
      });
    }
    if (existing === undefined || isEmptyTree(existing.list)) {
      this.defines.set(name, { list, source: this.source });
    }
  }

  private parseQuotedName(): string {
    const t = this.next();
    if (t.type !== 'String') {
      throw this.errAt(t, 'expected template name (quoted string)', {
        expected: 'string',
        found: tokenLabel(t),
      });
    }
    return decodeStringLiteral(t.value, t.pos, this.source);
  }

  // -------------------------------------------------------------------
  // Pipelines.
  //
  //   pipeline := decls? command (`|` command)*
  //   decls    := variable (`,` variable)* (`:=` | `=`)
  // -------------------------------------------------------------------

  private parsePipeline(): PipeNode {
    const startPos = this.peek().pos;
    const decls = this.tryParseDecls();
    const cmds: CommandNode[] = [this.parseCommand()];
    while (this.peek().type === 'Pipe') {
      this.next();
      const next = this.peek();
      if (!canStartPrimary(next.type)) {
        // A pipe with nothing after it, as in `{{ .Alerts | }}`. Go drops the
        // empty stage and parses this happily, and Mimir will accept it, so
        // refusing to save it here would block a template that works. Stop
        // reading the pipeline and let the caller expect the closing `}}`.
        break;
      }
      cmds.push(this.parseCommand());
    }
    return {
      type: 'Pipe',
      pos: startPos,
      decls: decls?.vars ?? [],
      isAssign: decls?.isAssign ?? false,
      cmds,
    };
  }

  private tryParseDecls(): { vars: VariableNode[]; isAssign: boolean } | undefined {
    if (this.peek().type !== 'Variable') {
      return undefined;
    }
    // We have to be conservative here — `$x` could be the start of a
    // declaration *or* a plain pipeline whose first command is just a
    // variable reference. Distinguish by scanning ahead for `:=` / `=`
    // (possibly through `, $y` chains).
    let n = 1;
    while (this.peek(n).type === 'Comma') {
      if (this.peek(n + 1).type !== 'Variable') {
        return undefined;
      }
      n += 2;
    }
    const opType = this.peek(n).type;
    if (opType !== 'Declare' && opType !== 'Assign') {
      return undefined;
    }

    const vars: VariableNode[] = [varFromToken(this.next() as Token)];
    while (this.peek().type === 'Comma') {
      this.next();
      vars.push(varFromToken(this.expect('Variable', '$variable')));
    }
    const op = this.next();
    return { vars, isAssign: op.type === 'Assign' };
  }

  // -------------------------------------------------------------------
  // Commands and primaries.
  //
  //   command := primary+
  //   primary := dot | field | variable | identifier | string | number
  //            | char | bool | nil | `(` pipeline `)` (`.field`)*
  // -------------------------------------------------------------------

  private parseCommand(): CommandNode {
    const startPos = this.peek().pos;
    const args: Node[] = [this.parsePrimary()];
    while (canStartPrimary(this.peek().type)) {
      args.push(this.parsePrimary());
    }
    return { type: 'Command', pos: startPos, args };
  }

  private parsePrimary(): Node {
    const t = this.next();
    switch (t.type) {
      case 'Dot':
        return { type: 'Dot', pos: t.pos } satisfies DotNode;
      case 'Field':
        return {
          type: 'Field',
          pos: t.pos,
          idents: t.value.slice(1).split('.'),
        } satisfies FieldNode;
      case 'Variable':
        return varFromToken(t);
      case 'Identifier':
        return { type: 'Identifier', pos: t.pos, ident: t.value } satisfies IdentifierNode;
      case 'String':
        return {
          type: 'String',
          pos: t.pos,
          raw: t.value,
          value: decodeStringLiteral(t.value, t.pos, this.source),
        } satisfies StringNode;
      case 'Number':
        return numberFromToken(t, this.source);
      case 'Char':
        // Treat runes as numbers — Go's parser does the same; the rune
        // value is the integer code point. We synthesize a NumberNode
        // with the original char-literal text preserved.
        return runeNumberFromToken(t, this.source);
      case 'Bool':
        return { type: 'Bool', pos: t.pos, value: t.value === 'true' } satisfies BoolNode;
      case 'Nil':
        return { type: 'Nil', pos: t.pos } satisfies NilNode;
      case 'LeftParen':
        return this.parseChainOrPipe(t.pos);
      default:
        throw this.errAt(t, `expected command argument, found ${tokenLabel(t)}`, {
          expected: 'command argument',
          found: tokenLabel(t),
        });
    }
  }

  private parseChainOrPipe(startPos: Pos): Node {
    const inner = this.parsePipeline();
    const rparen = this.expect('RightParen', '`)`');
    // Field chain on `(pipe).field` requires the `.` to be immediately
    // adjacent to `)` — otherwise it's a separate command argument.
    // The lexer's Field tokens carry source positions; if there was
    // whitespace between `)` and the next Field, their positions
    // won't be consecutive.
    const fields: string[] = [];
    const expectedNextOffset = rparen.pos.offset + 1;
    const t = this.peek();
    if (t.type === 'Field' && t.pos.offset === expectedNextOffset) {
      this.next();
      fields.push(...t.value.slice(1).split('.'));
    }
    if (fields.length === 0) {
      return inner;
    }
    return { type: 'Chain', pos: startPos, node: inner, fields } satisfies ChainNode;
  }
}

// ---------------------------------------------------------------------------
// Helpers — pure data-in / data-out, no parser state.
// ---------------------------------------------------------------------------

function finishList(pos: Pos, nodes: Node[]): ListNode {
  return { type: 'List', pos, nodes };
}

function trimFromToken(t: Token): TrimMarkers {
  return {
    trimLeft: t.trimLeft === true,
    trimRight: t.trimRight === true,
  };
}

function tokenLabel(t: Token): string {
  if (t.type === 'EOF') {
    return 'end of input';
  }
  return t.value || t.type;
}

function canStartPrimary(t: TokenType): boolean {
  switch (t) {
    case 'Dot':
    case 'Field':
    case 'Variable':
    case 'Identifier':
    case 'String':
    case 'Number':
    case 'Char':
    case 'Bool':
    case 'Nil':
    case 'LeftParen':
      return true;
    default:
      return false;
  }
}

function varFromToken(t: Token): VariableNode {
  return {
    type: 'Variable',
    pos: t.pos,
    idents: splitVariableIdents(t.value),
  };
}

/**
 * Whether a template body does nothing when run. Text that is only whitespace
 * counts as nothing, and so do comments; anything that could produce output or
 * branch does not. Mirrors IsEmptyTree in Go's text/template/parse.
 */
function isEmptyTree(node: Node | undefined): boolean {
  if (node === undefined) {
    return true;
  }
  switch (node.type) {
    case 'Text':
      return node.text.trim() === '';
    case 'Comment':
      return true;
    case 'List':
      return node.nodes.every(isEmptyTree);
    default:
      return false;
  }
}

function splitVariableIdents(value: string): string[] {
  // `$name.x.y` → ["$name", "x", "y"]; `$` → ["$"]
  const dotIdx = value.indexOf('.');
  if (dotIdx === -1) {
    return [value];
  }
  return [value.slice(0, dotIdx), ...value.slice(dotIdx + 1).split('.')];
}

function numberFromToken(t: Token, source?: string): NumberNode {
  const text = t.value;
  // Strip underscore separators per Go syntax.
  const cleaned = text.replace(/_/g, '');
  const lower = cleaned.toLowerCase();
  const isComplex = lower.endsWith('i');
  const body = isComplex ? cleaned.slice(0, -1) : cleaned;
  const isFloat =
    !isComplex &&
    (body.includes('.') ||
      (!body.startsWith('0x') && !body.startsWith('0X') && /[eE]/.test(body)) ||
      ((body.startsWith('0x') || body.startsWith('0X')) && /[pP]/.test(body)));
  const isInt = !isComplex && !isFloat;

  const base: NumberNode = {
    type: 'Number',
    pos: t.pos,
    text,
    isInt,
    isUint: false,
    isFloat,
    isComplex,
  };

  if (isInt) {
    const intValue = parseIntegerLiteral(body, t, source);
    return { ...base, intValue };
  }
  if (isFloat) {
    const floatValue = parseFloatLiteral(body, t, source);
    return { ...base, floatValue };
  }
  // complex
  const im = parseFloatLiteral(body, t, source);
  return { ...base, complexValue: [0, im] };
}

/**
 * Go's int types are 64 bits wide, so a literal that doesn't fit is a parse
 * error there even though JavaScript's BigInt would happily hold it.
 */
// Written as BigInt() calls rather than `2n ** 63n`: this repo's compile
// target predates BigInt literal syntax, though the BigInt function itself is
// fine at runtime.
const MIN_INT64 = -BigInt('9223372036854775808');
const MAX_UINT64 = BigInt('18446744073709551615');

function runeNumberFromToken(t: Token, source: string): NumberNode {
  const inner = decodeRuneLiteral(t.value, t.pos, source);
  return {
    type: 'Number',
    pos: t.pos,
    text: t.value,
    isInt: true,
    isUint: false,
    isFloat: false,
    isComplex: false,
    intValue: BigInt(inner),
  };
}

function parseIntegerLiteral(text: string, t: Token, source?: string): bigint {
  // Handle leading sign explicitly because BigInt() accepts "+123" but
  // not all base-prefixed signed forms uniformly.
  let sign = BigInt(1);
  let body = text;
  if (body.startsWith('+')) {
    body = body.slice(1);
  } else if (body.startsWith('-')) {
    sign = BigInt(-1);
    body = body.slice(1);
  }

  // BigInt() throws on things the lexer let through, like a bare "0x". Go
  // reports those rather than falling over, so we do too.
  let value: bigint;
  try {
    value = sign * BigInt(body);
  } catch {
    throw new ParseError(`illegal number syntax: ${JSON.stringify(t.value)}`, t.pos, { source });
  }

  if (value < MIN_INT64 || value > MAX_UINT64) {
    throw new ParseError(`integer overflow: ${JSON.stringify(t.value)}`, t.pos, { source });
  }

  return value;
}

/** `0x1p-2` and friends: hex mantissa, then a power-of-two exponent after `p`. */
const HEX_FLOAT = /^([+-]?)0[xX]([0-9a-fA-F]*)(?:\.([0-9a-fA-F]*))?[pP]([+-]?\d+)$/;

function parseFloatLiteral(text: string, t: Token, source?: string): number {
  // Go accepts hex floats, which Number() does not understand at all -- it
  // answers NaN for "0x1p-2". Convert those ourselves before falling through
  // to the ordinary case.
  const hex = HEX_FLOAT.exec(text);
  if (hex) {
    const [, sign, whole, fraction = '', exponent] = hex;
    if (whole === '' && fraction === '') {
      throw new ParseError(`illegal number syntax: ${JSON.stringify(t.value)}`, t.pos, { source });
    }
    let mantissa = whole === '' ? 0 : parseInt(whole, 16);
    for (let i = 0; i < fraction.length; i++) {
      mantissa += parseInt(fraction[i], 16) / 16 ** (i + 1);
    }
    const value = mantissa * 2 ** Number(exponent);
    return sign === '-' ? -value : value;
  }

  // Number() answers NaN for malformed input instead of complaining, which
  // would let "1.2.3" and "12abc" through as valid templates.
  const value = Number(text);
  if (Number.isNaN(value)) {
    throw new ParseError(`illegal number syntax: ${JSON.stringify(t.value)}`, t.pos, { source });
  }
  return value;
}

function decodeStringLiteral(raw: string, pos: Pos, source: string): string {
  if (raw.startsWith('`')) {
    return raw.slice(1, -1);
  }
  // Interpreted string: process escapes.
  let out = '';
  for (let i = 1; i < raw.length - 1; i++) {
    const c = raw[i];
    if (c !== '\\') {
      out += c;
      continue;
    }
    const next = raw[++i];
    switch (next) {
      case 'n':
        out += '\n';
        break;
      case 't':
        out += '\t';
        break;
      case 'r':
        out += '\r';
        break;
      case '\\':
        out += '\\';
        break;
      case '"':
        out += '"';
        break;
      case "'":
        out += "'";
        break;
      case 'a':
        out += '\x07';
        break;
      case 'b':
        out += '\b';
        break;
      case 'f':
        out += '\f';
        break;
      case 'v':
        out += '\v';
        break;
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7': {
        // Octal — 3 digits total including the `next`.
        const digits = next + (raw[i + 1] ?? '') + (raw[i + 2] ?? '');
        i += 2;
        out += String.fromCodePoint(Number.parseInt(digits, 8));
        break;
      }
      case 'x': {
        const digits = (raw[i + 1] ?? '') + (raw[i + 2] ?? '');
        i += 2;
        out += String.fromCodePoint(Number.parseInt(digits, 16));
        break;
      }
      case 'u': {
        const digits = raw.slice(i + 1, i + 5);
        i += 4;
        out += String.fromCodePoint(Number.parseInt(digits, 16));
        break;
      }
      case 'U': {
        const digits = raw.slice(i + 1, i + 9);
        i += 8;
        out += String.fromCodePoint(Number.parseInt(digits, 16));
        break;
      }
      default:
        throw new ParseError(`bad escape sequence \\${next}`, pos, {
          expected: 'valid escape sequence',
          found: `\\${next}`,
          source,
        });
    }
  }
  return out;
}

function decodeRuneLiteral(raw: string, pos: Pos, source: string): number {
  // raw is `'x'` — slice the inner content and reuse the string decoder
  // by wrapping in double quotes (after escaping a literal `"`).
  const inner = raw.slice(1, -1);
  const escaped = inner.replace(/"/g, '\\"');
  const decoded = decodeStringLiteral(`"${escaped}"`, pos, source);
  if (decoded.length === 0) {
    throw new ParseError('empty rune literal', pos, { source });
  }
  return decoded.codePointAt(0) ?? 0;
}
