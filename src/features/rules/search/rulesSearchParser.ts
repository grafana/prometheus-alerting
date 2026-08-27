/**
 * Regex-based search query parser for alert rules
 * Supports syntax like: namespace:foo group:bar rule:baz state:firing type:alerting label:team=frontend
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

const FILTER_PATTERNS = {
  datasource: /datasource:(?:"([^"]*)"|(\S+))/gi,
  namespace: /namespace:(?:"([^"]*)"|(\S+))/gi,
  group: /group:(?:"([^"]*)"|(\S+))/gi,
  rule: /rule:(?:"([^"]*)"|(\S+))/gi,
  state: /state:(?:"([^"]*)"|(\S+))/gi,
  type: /type:(?:"([^"]*)"|(\S+))/gi,
  label: /label:(?:"([^"]*)"|(\S+))/gi,
};

const FILTER_ORDER_PATTERN = /(datasource|namespace|group|rule|state|type|label):(?:"[^"]*"|\S+)/gi;

type RulesFilterName = keyof typeof FILTER_PATTERNS;

function formatValue(value: string): string {
  return /\s/.test(value) ? `"${value}"` : value;
}

/**
 * Parse a search query string into a RulesFilter object
 */
export function getSearchFilterFromQuery(query: string): RulesFilter {
  const filter: RulesFilter = {};

  let processedQuery = query;

  // Extract datasource filters (can have multiple)
  const datasourceMatches = [...query.matchAll(FILTER_PATTERNS.datasource)];
  if (datasourceMatches.length > 0) {
    filter.dataSourceNames = [];
    datasourceMatches.forEach((match) => {
      const value = match[1] || match[2]; // Quoted or unquoted
      filter.dataSourceNames?.push(value);
      processedQuery = processedQuery.replace(match[0], ' ');
    });
  }

  // Extract label filters (can have multiple)
  const labelMatches = [...query.matchAll(FILTER_PATTERNS.label)];
  if (labelMatches.length > 0) {
    filter.labels = [];
    labelMatches.forEach((match) => {
      const value = match[1] || match[2];
      filter.labels?.push(value);
      processedQuery = processedQuery.replace(match[0], ' ');
    });
  }

  // Extract single-value filters
  FILTER_PATTERNS.namespace.lastIndex = 0; // Reset regex state
  const namespaceMatch = FILTER_PATTERNS.namespace.exec(query);
  if (namespaceMatch) {
    filter.namespace = namespaceMatch[1] || namespaceMatch[2];
    processedQuery = processedQuery.replace(namespaceMatch[0], ' ');
  }

  FILTER_PATTERNS.group.lastIndex = 0;
  const groupMatch = FILTER_PATTERNS.group.exec(query);
  if (groupMatch) {
    filter.groupName = groupMatch[1] || groupMatch[2];
    processedQuery = processedQuery.replace(groupMatch[0], ' ');
  }

  FILTER_PATTERNS.rule.lastIndex = 0;
  const ruleMatch = FILTER_PATTERNS.rule.exec(query);
  if (ruleMatch) {
    filter.ruleName = ruleMatch[1] || ruleMatch[2];
    processedQuery = processedQuery.replace(ruleMatch[0], ' ');
  }

  FILTER_PATTERNS.state.lastIndex = 0;
  const stateMatch = FILTER_PATTERNS.state.exec(query);
  if (stateMatch) {
    filter.ruleState = stateMatch[1] || stateMatch[2];
    processedQuery = processedQuery.replace(stateMatch[0], ' ');
  }

  FILTER_PATTERNS.type.lastIndex = 0;
  const typeMatch = FILTER_PATTERNS.type.exec(query);
  if (typeMatch) {
    filter.ruleType = typeMatch[1] || typeMatch[2];
    processedQuery = processedQuery.replace(typeMatch[0], ' ');
  }

  const freeText = processedQuery.replace(/\s+/g, ' ').trim();
  if (!filter.ruleName && freeText) {
    filter.ruleName = freeText;
  }

  return filter;
}

function isRulesFilterName(value: string): value is RulesFilterName {
  return value in FILTER_PATTERNS;
}

interface QueryLayoutSlot {
  filterName: RulesFilterName;
  index: number;
  isFreeTextRule: boolean;
}

interface FilterToken {
  structured: string;
  freeText?: string;
}

type FilterTokens = Record<RulesFilterName, FilterToken[]>;

function getQueryLayout(query: string): QueryLayoutSlot[] {
  const layout: QueryLayoutSlot[] = [];

  for (const match of query.matchAll(FILTER_ORDER_PATTERN)) {
    const filterName = match[1].toLowerCase();
    if (isRulesFilterName(filterName)) {
      layout.push({ filterName, index: match.index, isFreeTextRule: false });
    }
  }

  const queryWithoutFilters = query.replace(FILTER_ORDER_PATTERN, (match) => ' '.repeat(match.length));
  const freeTextIndex = queryWithoutFilters.search(/\S/);
  const hasRuleFilter = layout.some(({ filterName }) => filterName === 'rule');
  if (freeTextIndex >= 0 && !hasRuleFilter) {
    layout.push({ filterName: 'rule', index: freeTextIndex, isFreeTextRule: true });
  }

  return layout.sort((left, right) => left.index - right.index);
}

function buildFilterTokens(filter: RulesFilter): FilterTokens {
  return {
    datasource: filter.dataSourceNames?.map((value) => ({ structured: `datasource:${formatValue(value)}` })) ?? [],
    namespace: filter.namespace ? [{ structured: `namespace:${formatValue(filter.namespace)}` }] : [],
    group: filter.groupName ? [{ structured: `group:${formatValue(filter.groupName)}` }] : [],
    rule: filter.ruleName ? [{ structured: `rule:${formatValue(filter.ruleName)}`, freeText: filter.ruleName }] : [],
    state: filter.ruleState ? [{ structured: `state:${filter.ruleState}` }] : [],
    type: filter.ruleType ? [{ structured: `type:${filter.ruleType}` }] : [],
    label: filter.labels?.map((value) => ({ structured: `label:${formatValue(value)}` })) ?? [],
  };
}

function applyQueryLayout(layout: QueryLayoutSlot[], tokensByFilter: FilterTokens): string {
  const parts: string[] = [];

  for (const { filterName, isFreeTextRule } of layout) {
    const token = tokensByFilter[filterName].shift();
    if (token) {
      parts.push(isFreeTextRule && token.freeText !== undefined ? token.freeText : token.structured);
    }
  }

  for (const tokens of Object.values(tokensByFilter)) {
    parts.push(...tokens.map(({ structured }) => structured));
  }

  return parts.join(' ');
}

/**
 * Convert a RulesFilter object back to a search query string while retaining the order of existing filters.
 */
export function applySearchFilterToQuery(query: string, filter: RulesFilter): string {
  return applyQueryLayout(getQueryLayout(query), buildFilterTokens(filter));
}
