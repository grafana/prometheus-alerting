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
      filter.dataSourceNames!.push(value);
      processedQuery = processedQuery.replace(match[0], ' ');
    });
  }

  // Extract label filters (can have multiple)
  const labelMatches = [...query.matchAll(FILTER_PATTERNS.label)];
  if (labelMatches.length > 0) {
    filter.labels = [];
    labelMatches.forEach((match) => {
      const value = match[1] || match[2];
      filter.labels!.push(value);
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

  return filter;
}

/**
 * Convert a RulesFilter object back to a search query string
 * Simplified version: just builds the query from filter values
 */
export function applySearchFilterToQuery(query: string, filter: RulesFilter): string {
  const parts: string[] = [];

  // Helper to format value
  const formatValue = (value: string) => {
    return /\s/.test(value) ? `"${value}"` : value;
  };

  // Add filters in a consistent order
  if (filter.dataSourceNames && filter.dataSourceNames.length > 0) {
    filter.dataSourceNames.forEach((ds) => parts.push(`datasource:${formatValue(ds)}`));
  }

  if (filter.namespace) {
    parts.push(`namespace:${formatValue(filter.namespace)}`);
  }

  if (filter.groupName) {
    parts.push(`group:${formatValue(filter.groupName)}`);
  }

  if (filter.ruleName) {
    parts.push(`rule:${formatValue(filter.ruleName)}`);
  }

  if (filter.ruleState) {
    parts.push(`state:${filter.ruleState}`);
  }

  if (filter.ruleType) {
    parts.push(`type:${filter.ruleType}`);
  }

  if (filter.labels && filter.labels.length > 0) {
    filter.labels.forEach((label) => parts.push(`label:${formatValue(label)}`));
  }

  return parts.join(' ');
}
