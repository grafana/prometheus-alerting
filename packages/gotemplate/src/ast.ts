// Adapted from promptctl/go-template-js (MIT), commit 5cf0a74.
// See VENDOR.md for the licence and what we changed.
/**
 * AST node types for go-template-js.
 *
 * Mirrors `text/template/parse` (https://pkg.go.dev/text/template/parse) so
 * an eventual Go port shares the same shape.
 *
 * [LAW:dataflow-not-control-flow] Every node has a single string literal
 * `type` discriminator. Downstream code (evaluator, walker, stringifier) is
 * one exhaustive switch over `Node["type"]` — no class hierarchies, no
 * instanceof checks. Variability lives in the data (the discriminator
 * value), not in scattered conditionals.
 *
 * [LAW:one-source-of-truth] Every node carries `pos: Pos` from a single
 * canonical Pos type. No node grows its own ad-hoc position fields.
 */

import type { Pos } from './pos';

// ---------------------------------------------------------------------------
// Trim markers — the `{{- ... -}}` whitespace-stripping syntax.
// ---------------------------------------------------------------------------

export interface TrimMarkers {
  readonly trimLeft: boolean;
  readonly trimRight: boolean;
}

export const NO_TRIM: TrimMarkers = { trimLeft: false, trimRight: false };

// ---------------------------------------------------------------------------
// Node base — type discriminator + position.
// ---------------------------------------------------------------------------

interface NodeBase<T extends string> {
  readonly type: T;
  readonly pos: Pos;
}

// ---------------------------------------------------------------------------
// Leaves.
// ---------------------------------------------------------------------------

export interface TextNode extends NodeBase<'Text'> {
  readonly text: string;
}

export interface CommentNode extends NodeBase<'Comment'> {
  /** The comment body, without the surrounding `{{/*` `*\/}}`. */
  readonly text: string;
  readonly trim: TrimMarkers;
}

export type DotNode = NodeBase<'Dot'>;
export type NilNode = NodeBase<'Nil'>;

export interface BoolNode extends NodeBase<'Bool'> {
  readonly value: boolean;
}

/**
 * Numeric literal. Go's parser admits ints, floats, complex, and untyped
 * constants in several bases. We preserve the original source `text` and
 * tag the parsed flavors so the evaluator can pick the right runtime
 * representation without re-lexing.
 */
export interface NumberNode extends NodeBase<'Number'> {
  /** Original source text (e.g. `0x10`, `1.5e3`, `0o17`, `42i`). */
  readonly text: string;
  readonly isInt: boolean;
  readonly isUint: boolean;
  readonly isFloat: boolean;
  readonly isComplex: boolean;
  /** Present iff `isInt || isUint`. Use bigint for safe full-range ints. */
  readonly intValue?: bigint;
  /** Present iff `isFloat`. */
  readonly floatValue?: number;
  /** Present iff `isComplex` — [real, imag]. */
  readonly complexValue?: readonly [number, number];
}

export interface StringNode extends NodeBase<'String'> {
  /** Source-as-written including surrounding quotes (e.g. `"hi"` or `` `raw` ``). */
  readonly raw: string;
  /** Decoded string value (escapes processed). */
  readonly value: string;
}

export interface IdentifierNode extends NodeBase<'Identifier'> {
  readonly ident: string;
}

/**
 * Field chain like `.x.y.z`.
 * `idents` excludes the leading dot — `.x.y` → `["x", "y"]`.
 */
export interface FieldNode extends NodeBase<'Field'> {
  readonly idents: readonly string[];
}

/**
 * Variable reference like `$var` or `$var.x.y`.
 * `idents[0]` is the variable's name *with* its leading `$` (`"$var"`),
 * matching Go's parse package convention. Subsequent entries are field
 * accesses.
 */
export interface VariableNode extends NodeBase<'Variable'> {
  readonly idents: readonly string[];
}

// ---------------------------------------------------------------------------
// Composites.
// ---------------------------------------------------------------------------

/** A sequence of nodes — the body of a template, branch, or block. */
export interface ListNode extends NodeBase<'List'> {
  readonly nodes: readonly Node[];
}

/**
 * A field access on a parenthesised pipeline result, e.g. `(pipe).x.y`.
 * `node` is the inner expression (typically a PipeNode or another
 * primary).
 */
export interface ChainNode extends NodeBase<'Chain'> {
  readonly node: Node;
  readonly fields: readonly string[];
}

/** A single command in a pipeline: head + arguments. */
export interface CommandNode extends NodeBase<'Command'> {
  readonly args: readonly Node[];
}

/**
 * A pipeline — `cmd1 a b | cmd2 c | cmd3`.
 *
 * `decls` carries left-hand variable declarations for assignment forms:
 *   `{{ $a := pipe }}` → decls = [$a], isAssign = false
 *   `{{ $a = pipe }}`  → decls = [$a], isAssign = true
 *   `{{ pipe }}`        → decls = [],   isAssign = false
 */
export interface PipeNode extends NodeBase<'Pipe'> {
  readonly decls: readonly VariableNode[];
  readonly isAssign: boolean;
  readonly cmds: readonly CommandNode[];
}

/** `{{ pipeline }}` — produces output from a pipeline value. */
export interface ActionNode extends NodeBase<'Action'> {
  readonly pipe: PipeNode;
  readonly trim: TrimMarkers;
}

// ---------------------------------------------------------------------------
// Branch nodes — if / range / with all share the same shape conceptually.
// We keep them as separate types so the discriminator lets the evaluator
// switch exhaustively, matching Go's parse package which emits IfNode,
// RangeNode, WithNode as distinct concrete types.
// ---------------------------------------------------------------------------

interface BranchFields {
  readonly pipe: PipeNode;
  readonly list: ListNode;
  /** Absent when there's no `{{else}}` clause. */
  readonly elseList?: ListNode;
  readonly trim: TrimMarkers;
}

export interface IfNode extends NodeBase<'If'>, BranchFields {}
export interface RangeNode extends NodeBase<'Range'>, BranchFields {}
export interface WithNode extends NodeBase<'With'>, BranchFields {}

// ---------------------------------------------------------------------------
// Range-body control-flow leaves — `{{break}}` and `{{continue}}`.
//
// [LAW:types-are-the-program] Break/continue carry no pipeline and no
// body. They are leaves whose only purpose is the discriminator: the
// evaluator's range loop switches on `type` to know which control-flow
// transition to perform. Encoding them as leaves (instead of, say, an
// ActionNode with a magic identifier) is the strongest theorem about
// them — the type forbids "{{break .foo}}" by construction, so no body
// has to guard against a stray pipeline.
//
// Their legality is *lexical*: only valid inside a `{{range}}` body
// (not inside a `{{define}}`/`{{block}}` body, even if those are
// lexically nested inside a range — those bodies are independent
// parse contexts in Go's text/template, and we match that here).
// The parser enforces this via a rangeDepth counter that is saved /
// restored around sub-template bodies.
// ---------------------------------------------------------------------------

export interface BreakNode extends NodeBase<'Break'> {
  readonly trim: TrimMarkers;
}

export interface ContinueNode extends NodeBase<'Continue'> {
  readonly trim: TrimMarkers;
}

// ---------------------------------------------------------------------------
// Sub-template nodes.
// ---------------------------------------------------------------------------

/** `{{template "name" pipe?}}` — invokes a named template. */
export interface TemplateNode extends NodeBase<'Template'> {
  readonly name: string;
  /** Optional argument expression. Absent when no pipe is supplied. */
  readonly pipe?: PipeNode;
  readonly trim: TrimMarkers;
}

/** `{{block "name" pipe}} list {{end}}` — define + invoke in one form. */
export interface BlockNode extends NodeBase<'Block'> {
  readonly name: string;
  readonly pipe?: PipeNode;
  readonly list: ListNode;
  readonly trim: TrimMarkers;
}

// ---------------------------------------------------------------------------
// The discriminated union.
// ---------------------------------------------------------------------------

export type Node =
  | TextNode
  | CommentNode
  | DotNode
  | NilNode
  | BoolNode
  | NumberNode
  | StringNode
  | IdentifierNode
  | FieldNode
  | VariableNode
  | ListNode
  | ChainNode
  | CommandNode
  | PipeNode
  | ActionNode
  | IfNode
  | RangeNode
  | WithNode
  | BreakNode
  | ContinueNode
  | TemplateNode
  | BlockNode;

export type NodeType = Node['type'];

export type NodeOf<T extends NodeType> = Extract<Node, { type: T }>;

// ---------------------------------------------------------------------------
// Type-level exhaustiveness helper.
//
// [LAW:dataflow-not-control-flow] Use `assertNever` in switches over Node
// to make adding a new node kind a compile error at every dispatch site,
// not a silent fallthrough.
// ---------------------------------------------------------------------------

export function assertNever(value: never): never {
  throw new Error(`unhandled node kind: ${JSON.stringify(value)}`);
}
