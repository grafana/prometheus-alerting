import { type InhibitRule } from './api/types/common';
import { type MatcherOperator } from './matchers.utils';

const matcherOperators: MatcherOperator[] = ['=~', '!~', '!=', '='];

/**
 * A matcher whose name and value have been decoded from Alertmanager syntax.
 * Inhibition forms edit these semantic strings and encode them only on save.
 */
export type SemanticInhibitMatcher = [name: string, operator: MatcherOperator, value: string];

/**
 * An inhibit rule with deprecated matcher maps folded into semantic matcher tuples.
 * Deprecated maps are already semantic values, so they bypass textual parsing.
 */
export type NormalizedInhibitRule = Omit<
  InhibitRule,
  'source_matchers' | 'target_matchers' | 'source_match' | 'source_match_re' | 'target_match' | 'target_match_re'
> & {
  source_matchers: SemanticInhibitMatcher[];
  target_matchers: SemanticInhibitMatcher[];
};

type MatcherDialect = 'classic' | 'utf8';
type MatcherTokenKind = 'name' | 'value';

interface RawMatcherTokens {
  name: string;
  operator: MatcherOperator;
  value: string;
}

const classicMatcherLabelName = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/;
const utf8UnquotedNameDisallowedCharacters = /[\s{}!=~,\\"'`]/;

/** The classic Alertmanager grammar accepts Prometheus label names, including colons. */
function isClassicMatcherLabelName(name: string): boolean {
  return classicMatcherLabelName.test(name);
}

/**
 * Normalizes current textual matcher arrays and deprecated semantic maps.
 * Keep this order: current syntax, deprecated regex map, deprecated equality map.
 */
export function normalizeInhibitRuleMatchers(inhibitRule: InhibitRule): NormalizedInhibitRule {
  const sourceMatchers = normalizeMatcherSources(
    inhibitRule.source_matchers,
    inhibitRule.source_match_re,
    inhibitRule.source_match
  );
  const targetMatchers = normalizeMatcherSources(
    inhibitRule.target_matchers,
    inhibitRule.target_match_re,
    inhibitRule.target_match
  );

  const { source_match, source_match_re, target_match, target_match_re, ...ruleWithoutDeprecatedMatchers } =
    inhibitRule;

  return {
    ...ruleWithoutDeprecatedMatchers,
    source_matchers: sourceMatchers,
    target_matchers: targetMatchers,
  };
}

function normalizeMatcherSources(
  currentMatchers: string[] | undefined,
  deprecatedRegexMatchers: Record<string, string> | undefined,
  deprecatedEqualityMatchers: Record<string, string> | undefined
): SemanticInhibitMatcher[] {
  return [
    ...(currentMatchers ?? []).flatMap(parseInhibitMatcherExpression),
    ...Object.entries(deprecatedRegexMatchers ?? {}).map(
      ([name, value]): SemanticInhibitMatcher => [name, '=~', value]
    ),
    ...Object.entries(deprecatedEqualityMatchers ?? {}).map(
      ([name, value]): SemanticInhibitMatcher => [name, '=', value]
    ),
  ];
}

/** Parses one Alertmanager matcher expression, which may be brace-contained and comma-separated. */
export function parseInhibitMatcherExpression(expression: string): SemanticInhibitMatcher[] {
  return splitMatcherListOutsideQuotes(removeOptionalOuterBraces(expression)).map(parseSingleInhibitMatcher);
}

/** Alertmanager tolerates whitespace around independently optional outer braces. */
function removeOptionalOuterBraces(expression: string): string {
  let content = expression.trim();
  if (content.startsWith('{')) {
    content = content.slice(1);
  }
  if (content.endsWith('}')) {
    content = content.slice(0, -1);
  }
  return content.trim();
}

function splitMatcherListOutsideQuotes(expression: string): string[] {
  const matchers: string[] = [];
  let segmentStart = 0;
  let quoted = false;
  let escaped = false;

  for (let index = 0; index < expression.length; index++) {
    const character = expression[index];
    if (quoted && escaped) {
      escaped = false;
    } else if (quoted && character === '\\') {
      escaped = true;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (!quoted && character === ',') {
      matchers.push(expression.slice(segmentStart, index));
      segmentStart = index + 1;
    }
  }

  if (quoted) {
    throw new Error(`Invalid matcher: ${expression}`);
  }

  matchers.push(expression.slice(segmentStart));
  return matchers.filter((matcher) => matcher.trim().length > 0);
}

function parseSingleInhibitMatcher(expression: string): SemanticInhibitMatcher {
  const tokens = splitSingleMatcherAtOperator(expression);
  const dialect = selectFallbackMatcherDialect(tokens.name);

  if (dialect === 'utf8' && !startsWithQuote(tokens.name) && utf8UnquotedNameDisallowedCharacters.test(tokens.name)) {
    throw new Error(`Invalid UTF-8 matcher name: ${tokens.name}`);
  }

  return [
    decodeMatcherToken(tokens.name, dialect, 'name'),
    tokens.operator,
    decodeMatcherToken(tokens.value, dialect, 'value'),
  ];
}

function splitSingleMatcherAtOperator(expression: string): RawMatcherTokens {
  let quoted = false;
  let escaped = false;

  for (let index = 0; index < expression.length; index++) {
    const character = expression[index];
    if (quoted && escaped) {
      escaped = false;
      continue;
    }
    if (quoted && character === '\\') {
      escaped = true;
      continue;
    }
    if (character === '"') {
      quoted = !quoted;
      continue;
    }
    if (!quoted) {
      const operator = matcherOperators.find((candidate) => expression.startsWith(candidate, index));
      if (operator) {
        const name = expression.slice(0, index).trim();
        const value = expression.slice(index + operator.length).trim();
        if (!name) {
          throw new Error(`Invalid matcher: ${expression}`);
        }
        return { name, operator, value };
      }
    }
  }

  throw new Error(`Invalid matcher: ${expression}`);
}

/**
 * Alertmanager fallback returns the classic result when classic and UTF-8 parsing disagree.
 * A raw classic label name selects classic parsing; quoted and UTF-8-only names select UTF-8 parsing.
 */
function selectFallbackMatcherDialect(rawNameToken: string): MatcherDialect {
  return isClassicMatcherLabelName(rawNameToken) ? 'classic' : 'utf8';
}

function decodeMatcherToken(token: string, dialect: MatcherDialect, kind: MatcherTokenKind): string {
  if (!startsWithQuote(token)) {
    if (token.includes('"')) {
      throw new Error(`Invalid matcher ${kind}: ${token}`);
    }

    // The classic parser unescapes its raw third token even without surrounding quotes.
    return dialect === 'classic' ? decodeClassicMatcherValue(token) : token;
  }

  if (!token.endsWith('"') || token.length < 2) {
    throw new Error(`Invalid matcher ${kind}: ${token}`);
  }

  const quotedContents = token.slice(1, -1);
  if (hasUnescapedQuote(quotedContents)) {
    throw new Error(`Invalid matcher ${kind}: ${token}`);
  }

  return dialect === 'classic'
    ? decodeClassicMatcherValue(quotedContents)
    : decodeGoDoubleQuotedContents(quotedContents);
}

function startsWithQuote(token: string): boolean {
  return token.startsWith('"');
}

function hasUnescapedQuote(value: string): boolean {
  let escaped = false;
  for (const character of value) {
    if (escaped) {
      escaped = false;
    } else if (character === '\\') {
      escaped = true;
    } else if (character === '"') {
      return true;
    }
  }
  return false;
}

/** Implements classic Alertmanager/OpenMetrics escaping: \" , \\ , and \n are special; other escapes stay literal. */
function decodeClassicMatcherValue(value: string): string {
  let decoded = '';
  for (let index = 0; index < value.length; index++) {
    const character = value[index];
    if (character !== '\\' || index === value.length - 1) {
      decoded += character;
      continue;
    }

    const escaped = value[++index];
    if (escaped === 'n') {
      decoded += '\n';
    } else if (escaped === '"' || escaped === '\\') {
      decoded += escaped;
    } else {
      decoded += `\\${escaped}`;
    }
  }
  return decoded;
}

/**
 * Decodes Go double-quoted contents for UTF-8-only matcher syntax.
 * Accumulate byte escapes before decoding so multibyte UTF-8 does not become Latin-1.
 */
function decodeGoDoubleQuotedContents(value: string): string {
  const decoded: string[] = [];
  const escapedBytes: number[] = [];
  const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

  const flushEscapedBytes = () => {
    if (escapedBytes.length === 0) {
      return;
    }
    try {
      decoded.push(utf8Decoder.decode(new Uint8Array(escapedBytes)));
    } catch {
      throw new Error(`Invalid UTF-8 matcher byte escape: ${value}`);
    }
    escapedBytes.length = 0;
  };

  const appendUnicodeCodePoint = (codePoint: number) => {
    if (codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) {
      throw new Error(`Invalid UTF-8 matcher code point: ${codePoint.toString(16)}`);
    }
    flushEscapedBytes();
    decoded.push(String.fromCodePoint(codePoint));
  };

  for (let index = 0; index < value.length; index++) {
    const character = value[index];
    if (character !== '\\') {
      if (character === '\n' || hasUnpairedSurrogate(value, index)) {
        throw new Error(`Invalid UTF-8 matcher value: ${value}`);
      }
      flushEscapedBytes();
      decoded.push(character);
      continue;
    }

    if (index === value.length - 1) {
      throw new Error(`Invalid UTF-8 matcher value: ${value}`);
    }

    const escaped = value[++index];
    const simpleEscape = goSimpleEscapes[escaped];
    if (simpleEscape !== undefined) {
      flushEscapedBytes();
      decoded.push(simpleEscape);
      continue;
    }

    if (/[0-7]/.test(escaped)) {
      const octalDigits = `${escaped}${value.slice(index + 1, index + 3)}`;
      if (!/^[0-7]{3}$/.test(octalDigits)) {
        throw new Error(`Invalid UTF-8 matcher octal escape: \\${octalDigits}`);
      }
      const byte = Number.parseInt(octalDigits, 8);
      if (byte > 0xff) {
        throw new Error(`Invalid UTF-8 matcher octal escape: \\${octalDigits}`);
      }
      escapedBytes.push(byte);
      index += 2;
      continue;
    }

    const unicodeEscapeLength = goUnicodeEscapeLengths[escaped];
    if (unicodeEscapeLength === undefined) {
      throw new Error(`Invalid UTF-8 matcher escape: \\${escaped}`);
    }

    const hexDigits = value.slice(index + 1, index + 1 + unicodeEscapeLength);
    if (!new RegExp(`^[0-9A-Fa-f]{${unicodeEscapeLength}}$`).test(hexDigits)) {
      throw new Error(`Invalid UTF-8 matcher escape: \\${escaped}${hexDigits}`);
    }

    const codePoint = Number.parseInt(hexDigits, 16);
    if (escaped === 'x') {
      escapedBytes.push(codePoint);
    } else {
      appendUnicodeCodePoint(codePoint);
    }
    index += unicodeEscapeLength;
  }

  flushEscapedBytes();
  return decoded.join('');
}

const goSimpleEscapes: Record<string, string> = {
  a: '\x07',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
  v: '\x0B',
  '\\': '\\',
  '"': '"',
};

const goUnicodeEscapeLengths: Record<string, number> = {
  x: 2,
  u: 4,
  U: 8,
};

function hasUnpairedSurrogate(value: string, index: number): boolean {
  const codeUnit = value.charCodeAt(index);
  if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
    const next = value.charCodeAt(index + 1);
    return next < 0xdc00 || next > 0xdfff;
  }
  if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
    const previous = value.charCodeAt(index - 1);
    return index === 0 || previous < 0xd800 || previous > 0xdbff;
  }
  return false;
}

/**
 * Encodes semantic inhibition tuples into canonical Alertmanager matcher syntax.
 * Values are always quoted; UTF-8-only names use Go-style quoted name syntax.
 */
export function encodeSemanticInhibitMatcher([name, operator, value]: SemanticInhibitMatcher): string {
  const encodedName = isClassicMatcherLabelName(name) ? name : encodeCanonicalQuotedMatcherToken(name);
  return `${encodedName}${operator}${encodeCanonicalQuotedMatcherToken(value)}`;
}

// Do not JSON.stringify here: classic fallback treats only backslash, quote, and LF as escape syntax.
function encodeCanonicalQuotedMatcherToken(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
}

/** Formats a semantic inhibition tuple for UI display, not for Alertmanager configuration. */
export function formatInhibitMatcherForDisplay([name, operator, value]: SemanticInhibitMatcher): string {
  return `${name} ${operator} ${value || '""'}`;
}
