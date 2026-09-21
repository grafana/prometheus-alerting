/**
 * Search query parser for alert rules. The tokenizer is deliberately small: it understands only
 * the query syntax owned by this page, leaving everything else as rule-name text.
 */

export interface RulesFilter {
  dataSourceNames?: string[];
  namespace?: string;
  groupName?: string;
  ruleName?: string;
  ruleState?: string;
  ruleType?: string;
  labels?: string[];
}

const FILTER_NAMES = ['datasource', 'namespace', 'group', 'rule', 'state', 'type', 'label'] as const;

type RulesFilterName = (typeof FILTER_NAMES)[number];
type FilterTokens = Record<RulesFilterName, string[]>;

const FILTER_NAME_SET = new Set<string>(FILTER_NAMES);
const RULE_STATES = new Set(['firing', 'pending', 'inactive', 'normal', 'recovering', 'unknown']);
const RULE_TYPES = new Set(['alerting', 'recording']);

interface FilterToken {
  kind: 'filter';
  filterName: RulesFilterName;
  value: string;
}

interface FreeTextToken {
  kind: 'free-text';
  value: string;
}

interface EmptyFilterToken {
  kind: 'empty-filter';
}

type QueryToken = FilterToken | FreeTextToken | EmptyFilterToken;

interface QueryLayoutItem {
  filterName: RulesFilterName;
  isFreeTextRule: boolean;
}

function isRulesFilterName(value: string): value is RulesFilterName {
  return FILTER_NAME_SET.has(value);
}

function isAllowedFilterValue(filterName: RulesFilterName, value: string): boolean {
  const normalizedValue = value.toLowerCase();
  if (filterName === 'state') {
    return RULE_STATES.has(normalizedValue);
  }
  if (filterName === 'type') {
    return RULE_TYPES.has(normalizedValue);
  }
  return true;
}

function normalizeFilterValue(filterName: RulesFilterName, value: string): string {
  return filterName === 'state' || filterName === 'type' ? value.toLowerCase() : value;
}

interface LexicalToken {
  value: string;
  end: number;
  filterName?: RulesFilterName;
}

/**
 * Reads one whitespace-delimited token. Quotes concatenate literal segments and only decode
 * escaped quotes and backslashes. An unterminated quote therefore consumes the remaining query.
 */
function readLexicalToken(query: string, start: number): LexicalToken {
  let index = start;
  let quoted = false;
  let consideredPrefix = false;
  let filterName: RulesFilterName | undefined;
  let value = '';

  while (index < query.length) {
    const character = query[index];
    if (quoted && character === '\\' && index + 1 < query.length) {
      const nextCharacter = query[index + 1];
      if (nextCharacter === '"' || nextCharacter === '\\') {
        value += nextCharacter;
        index += 2;
        continue;
      }
    }
    if (character === '"') {
      quoted = !quoted;
      consideredPrefix = true;
    } else if (!quoted && /\s/.test(character)) {
      break;
    } else {
      if (!quoted && character === ':' && !consideredPrefix) {
        const candidate = query.slice(start, index).toLowerCase();
        filterName = isRulesFilterName(candidate) ? candidate : undefined;
        consideredPrefix = true;
      }
      value += character;
    }
    index++;
  }

  return { value, end: index, filterName };
}

/**
 * Tokenize only at whitespace boundaries. This prevents, for example,
 * `label:description=state:firing` from producing a state filter.
 */
function tokenizeQuery(query: string): QueryToken[] {
  const tokens: QueryToken[] = [];
  let index = 0;

  while (index < query.length) {
    while (index < query.length && /\s/.test(query[index])) {
      index++;
    }
    if (index === query.length) {
      break;
    }

    const token = readLexicalToken(query, index);
    if (!token.filterName) {
      tokens.push({ kind: 'free-text', value: token.value });
    } else {
      const value = token.value.slice(token.filterName.length + 1);
      if (!value) {
        tokens.push({ kind: 'empty-filter' });
      } else if (isAllowedFilterValue(token.filterName, value)) {
        tokens.push({ kind: 'filter', filterName: token.filterName, value: normalizeFilterValue(token.filterName, value) });
      } else {
        tokens.push({ kind: 'free-text', value: token.value });
      }
    }
    index = token.end;
  }

  return tokens;
}

function normalizeFreeText(tokens: QueryToken[]): string {
  return tokens
    .flatMap((token) => (token.kind === 'free-text' ? [token.value] : []))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildQueryLayout(tokens: QueryToken[]): QueryLayoutItem[] {
  const hasStructuredRule = tokens.some((token) => token.kind === 'filter' && token.filterName === 'rule');
  const layout: QueryLayoutItem[] = [];
  let addedFreeTextRule = false;

  for (const token of tokens) {
    if (token.kind === 'filter') {
      layout.push({ filterName: token.filterName, isFreeTextRule: false });
    } else if (token.kind === 'free-text' && !hasStructuredRule && !addedFreeTextRule) {
      layout.push({ filterName: 'rule', isFreeTextRule: true });
      addedFreeTextRule = true;
    }
  }

  return layout;
}

function escapeQuotedValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function formatValue(value: string): string {
  return /[\s"\\]/.test(value) ? `"${escapeQuotedValue(value)}"` : value;
}

function buildFilterTokens(filter: RulesFilter): FilterTokens {
  return {
    datasource: filter.dataSourceNames?.map((value) => `datasource:${formatValue(value)}`) ?? [],
    namespace: filter.namespace ? [`namespace:${formatValue(filter.namespace)}`] : [],
    group: filter.groupName ? [`group:${formatValue(filter.groupName)}`] : [],
    rule: filter.ruleName ? [`rule:${formatValue(filter.ruleName)}`] : [],
    state: filter.ruleState ? [`state:${filter.ruleState}`] : [],
    type: filter.ruleType ? [`type:${filter.ruleType}`] : [],
    label: filter.labels?.map((value) => `label:${formatValue(value)}`) ?? [],
  };
}

function canUseFreeTextRule(value: string): boolean {
  const parsed = getSearchFilterFromQuery(value);
  return parsed.ruleName === value && Object.keys(parsed).length === 1;
}

/** Parse a search query string into the rule-list filter object. */
export function getSearchFilterFromQuery(query: string): RulesFilter {
  const tokens = tokenizeQuery(query);
  const filter: RulesFilter = {};

  for (const token of tokens) {
    if (token.kind !== 'filter') {
      continue;
    }

    switch (token.filterName) {
      case 'datasource':
        filter.dataSourceNames = [...(filter.dataSourceNames ?? []), token.value];
        break;
      case 'label':
        filter.labels = [...(filter.labels ?? []), token.value];
        break;
      case 'namespace':
        filter.namespace ??= token.value;
        break;
      case 'group':
        filter.groupName ??= token.value;
        break;
      case 'rule':
        filter.ruleName ??= token.value;
        break;
      case 'state':
        filter.ruleState ??= token.value;
        break;
      case 'type':
        filter.ruleType ??= token.value;
        break;
    }
  }

  // A structured rule token deliberately wins over arbitrary free text.
  const freeText = normalizeFreeText(tokens);
  if (!filter.ruleName && freeText) {
    filter.ruleName = freeText;
  }

  return filter;
}

/**
 * Convert a RulesFilter object back to a query, preserving each existing structured filter's
 * position. New filters are appended in the canonical filter order.
 */
export function applySearchFilterToQuery(query: string, filter: RulesFilter): string {
  const tokensByFilter = buildFilterTokens(filter);
  const parts: string[] = [];

  for (const { filterName, isFreeTextRule } of buildQueryLayout(tokenizeQuery(query))) {
    const token = tokensByFilter[filterName].shift();
    if (!token) {
      continue;
    }
    if (isFreeTextRule && filter.ruleName && canUseFreeTextRule(filter.ruleName)) {
      parts.push(filter.ruleName);
    } else {
      parts.push(token);
    }
  }

  for (const tokens of Object.values(tokensByFilter)) {
    parts.push(...tokens);
  }

  return parts.join(' ');
}
