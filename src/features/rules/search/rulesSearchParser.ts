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

export type RulesFilterName = 'datasource' | 'namespace' | 'group' | 'rule' | 'state' | 'type' | 'label';

export interface ParsedRulesSearchQuery {
  filter: RulesFilter;
  filterOrder: RulesFilterName[];
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

function formatValue(value: string): string {
  return /\s/.test(value) ? `"${value}"` : value;
}

function removeFilterMatch(query: string, match: RegExpMatchArray): string {
  if (match.index === undefined) {
    return query;
  }

  return `${query.slice(0, match.index)}${' '.repeat(match[0].length)}${query.slice(match.index + match[0].length)}`;
}

/**
 * Parse a search query into filter values and their order in the original query.
 */
export function parseRulesSearchQuery(query: string): ParsedRulesSearchQuery {
  const filter: RulesFilter = {};
  const orderedMatches: Array<{ filterName: RulesFilterName; index: number }> = [];
  let processedQuery = query;

  const recordMatch = (filterName: RulesFilterName, match: RegExpMatchArray) => {
    orderedMatches.push({ filterName, index: match.index ?? 0 });
    processedQuery = removeFilterMatch(processedQuery, match);
  };

  const datasourceMatches = [...query.matchAll(FILTER_PATTERNS.datasource)];
  if (datasourceMatches.length > 0) {
    filter.dataSourceNames = [];
    datasourceMatches.forEach((match) => {
      const value = match[1] || match[2];
      filter.dataSourceNames?.push(value);
      recordMatch('datasource', match);
    });
  }

  const labelMatches = [...query.matchAll(FILTER_PATTERNS.label)];
  if (labelMatches.length > 0) {
    filter.labels = [];
    labelMatches.forEach((match) => {
      const value = match[1] || match[2];
      filter.labels?.push(value);
      recordMatch('label', match);
    });
  }

  FILTER_PATTERNS.namespace.lastIndex = 0;
  const namespaceMatch = FILTER_PATTERNS.namespace.exec(query);
  if (namespaceMatch) {
    filter.namespace = namespaceMatch[1] || namespaceMatch[2];
    recordMatch('namespace', namespaceMatch);
  }

  FILTER_PATTERNS.group.lastIndex = 0;
  const groupMatch = FILTER_PATTERNS.group.exec(query);
  if (groupMatch) {
    filter.groupName = groupMatch[1] || groupMatch[2];
    recordMatch('group', groupMatch);
  }

  FILTER_PATTERNS.rule.lastIndex = 0;
  const ruleMatch = FILTER_PATTERNS.rule.exec(query);
  if (ruleMatch) {
    filter.ruleName = ruleMatch[1] || ruleMatch[2];
    recordMatch('rule', ruleMatch);
  }

  FILTER_PATTERNS.state.lastIndex = 0;
  const stateMatch = FILTER_PATTERNS.state.exec(query);
  if (stateMatch) {
    filter.ruleState = stateMatch[1] || stateMatch[2];
    recordMatch('state', stateMatch);
  }

  FILTER_PATTERNS.type.lastIndex = 0;
  const typeMatch = FILTER_PATTERNS.type.exec(query);
  if (typeMatch) {
    filter.ruleType = typeMatch[1] || typeMatch[2];
    recordMatch('type', typeMatch);
  }

  const freeText = processedQuery.replace(/\s+/g, ' ').trim();
  if (!filter.ruleName && freeText) {
    filter.ruleName = freeText;
    orderedMatches.push({ filterName: 'rule', index: processedQuery.search(/\S/) });
  }

  return {
    filter,
    filterOrder: orderedMatches.sort((left, right) => left.index - right.index).map(({ filterName }) => filterName),
  };
}

/**
 * Convert a RulesFilter object back to a search query string while retaining the order of existing filters.
 */
export function applySearchFilterToQuery(filterOrder: RulesFilterName[], filter: RulesFilter): string {
  const tokensByFilter = {
    datasource: filter.dataSourceNames?.map((value) => `datasource:${formatValue(value)}`) ?? [],
    namespace: filter.namespace ? [`namespace:${formatValue(filter.namespace)}`] : [],
    group: filter.groupName ? [`group:${formatValue(filter.groupName)}`] : [],
    rule: filter.ruleName ? [`rule:${formatValue(filter.ruleName)}`] : [],
    state: filter.ruleState ? [`state:${filter.ruleState}`] : [],
    type: filter.ruleType ? [`type:${filter.ruleType}`] : [],
    label: filter.labels?.map((value) => `label:${formatValue(value)}`) ?? [],
  } satisfies Record<RulesFilterName, string[]>;
  const parts: string[] = [];

  for (const filterName of filterOrder) {
    const token = tokensByFilter[filterName].shift();
    if (token) {
      parts.push(token);
    }
  }

  for (const tokens of Object.values(tokensByFilter)) {
    parts.push(...tokens);
  }

  return parts.join(' ');
}
