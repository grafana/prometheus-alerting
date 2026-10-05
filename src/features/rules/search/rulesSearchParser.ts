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
  ruleHealth?: string;
  labels?: string[];
}

const FILTER_NAMES = ['datasource', 'namespace', 'group', 'rule', 'state', 'type', 'health', 'label'] as const;

type RulesFilterName = (typeof FILTER_NAMES)[number];
type FilterTokens = Record<RulesFilterName, string[]>;

const FILTER_NAME_SET = new Set<string>(FILTER_NAMES);
const RULE_STATES = new Set(['firing', 'pending', 'inactive', 'normal', 'recovering', 'unknown']);
const RULE_TYPES = new Set(['alerting', 'recording']);
// Prometheus reports a failing rule as "err", which is what the details tab shows. Both spellings
// are accepted and stored as "error", the spelling Grafana's own rule list uses.
const RULE_HEALTHS = new Set(['ok', 'error', 'err', 'unknown']);

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

type QueryLayoutItem =
  | { kind: 'filter'; filterName: RulesFilterName }
  | { kind: 'free-text-rule' }
  | { kind: 'free-text'; value: string };

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
  if (filterName === 'health') {
    return RULE_HEALTHS.has(normalizedValue);
  }
  return true;
}

function normalizeFilterValue(filterName: RulesFilterName, value: string): string {
  if (filterName === 'health') {
    const health = value.toLowerCase();
    return health === 'err' ? 'error' : health;
  }
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

function skipWhitespace(query: string, start: number): number {
  let index = start;
  while (index < query.length && /\s/.test(query[index])) {
    index++;
  }
  return index;
}

/**
 * Tokenize only at whitespace boundaries. This prevents, for example,
 * `label:description=state:firing` from producing a state filter.
 *
 * A filter key followed by a space, such as `namespace: prod`, takes the next word as its value,
 * unless that word is a filter of its own or isn't a valid value for the key.
 */
function tokenizeQuery(query: string): QueryToken[] {
  const tokens: QueryToken[] = [];
  let index = skipWhitespace(query, 0);

  while (index < query.length) {
    const start = index;
    const token = readLexicalToken(query, start);
    index = skipWhitespace(query, token.end);

    if (!token.filterName) {
      tokens.push({ kind: 'free-text', value: token.value });
      continue;
    }

    let value = token.value.slice(token.filterName.length + 1);
    // `namespace:""` ends in quotes rather than at the colon, so it stays an explicitly empty filter.
    const endsAtColon = token.end === start + token.filterName.length + 1;
    if (endsAtColon && index < query.length) {
      const nextToken = readLexicalToken(query, index);
      if (!nextToken.filterName && isAllowedFilterValue(token.filterName, nextToken.value)) {
        value = nextToken.value;
        index = skipWhitespace(query, nextToken.end);
      }
    }

    if (!value) {
      tokens.push({ kind: 'empty-filter' });
    } else if (isAllowedFilterValue(token.filterName, value)) {
      tokens.push({
        kind: 'filter',
        filterName: token.filterName,
        value: normalizeFilterValue(token.filterName, value),
      });
    } else {
      tokens.push({ kind: 'free-text', value: token.value });
    }
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
      layout.push({ kind: 'filter', filterName: token.filterName });
    } else if (token.kind !== 'free-text') {
      continue;
    } else if (hasStructuredRule) {
      // A `rule:` filter means this text isn't used for filtering, but it's still what the user typed.
      if (token.value) {
        layout.push({ kind: 'free-text', value: token.value });
      }
    } else if (!addedFreeTextRule) {
      layout.push({ kind: 'free-text-rule' });
      addedFreeTextRule = true;
    }
  }

  return layout;
}

function escapeQuotedValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// An empty value is quoted so that `datasource:""` can't pick up the next word as its value.
function formatValue(value: string): string {
  return !value || /[\s"\\]/.test(value) ? `"${escapeQuotedValue(value)}"` : value;
}

/** Writes free text so it reads back as one piece of free text, quoting it if it would look like a filter. */
function formatFreeText(value: string): string {
  const tokens = tokenizeQuery(value);
  const [token] = tokens;
  const readsBackUnchanged = tokens.length === 1 && token.kind === 'free-text' && token.value === value;
  return readsBackUnchanged ? value : `"${escapeQuotedValue(value)}"`;
}

function buildFilterTokens(filter: RulesFilter): FilterTokens {
  return {
    datasource: filter.dataSourceNames?.map((value) => `datasource:${formatValue(value)}`) ?? [],
    namespace: filter.namespace ? [`namespace:${formatValue(filter.namespace)}`] : [],
    group: filter.groupName ? [`group:${formatValue(filter.groupName)}`] : [],
    rule: filter.ruleName ? [`rule:${formatValue(filter.ruleName)}`] : [],
    state: filter.ruleState ? [`state:${filter.ruleState}`] : [],
    type: filter.ruleType ? [`type:${filter.ruleType}`] : [],
    health: filter.ruleHealth ? [`health:${filter.ruleHealth}`] : [],
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
      case 'health':
        filter.ruleHealth ??= token.value;
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
 * position. New filters are appended in the canonical filter order. Text typed next to a `rule:`
 * filter is kept as long as a rule name is still set; clearing the name clears it too.
 */
export function applySearchFilterToQuery(query: string, filter: RulesFilter): string {
  const tokensByFilter = buildFilterTokens(filter);
  const parts: string[] = [];

  for (const item of buildQueryLayout(tokenizeQuery(query))) {
    if (item.kind === 'free-text') {
      if (filter.ruleName) {
        parts.push(formatFreeText(item.value));
      }
      continue;
    }

    const token = tokensByFilter[item.kind === 'filter' ? item.filterName : 'rule'].shift();
    if (!token) {
      continue;
    }
    if (item.kind === 'free-text-rule' && filter.ruleName && canUseFreeTextRule(filter.ruleName)) {
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
