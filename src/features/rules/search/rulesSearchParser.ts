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

/** Matches a filter key with no usable value, such as the `rule:` a user has half typed. */
const VALUELESS_FILTER_PATTERN = new RegExp(
  `(?:^|\\s)(?:${Object.keys(FILTER_PATTERNS).join('|')}):(?:"")?(?=\\s|$)`,
  'gi'
);

function formatValue(value: string): string {
  return /\s/.test(value) ? `"${value}"` : value;
}

function readFilterValue(match: RegExpMatchArray): string {
  const quotedValue = match[1];
  if (quotedValue !== undefined) {
    return quotedValue;
  }

  // An unterminated quote, as in `rule:"my rule`, must not leak the quote into the value.
  return (match[2] ?? '').replace(/^"/, '');
}

function normalizeFreeText(text: string): string {
  return text
    .replace(VALUELESS_FILTER_PATTERN, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^"+/, '')
    .replace(/"+$/, '')
    .trim();
}

/**
 * Parse a search query string into a RulesFilter object
 */
export function getSearchFilterFromQuery(query: string): RulesFilter {
  const filter: RulesFilter = {};

  let processedQuery = query;

  /** Removes every occurrence of a filter from the free text and returns the values it carried. */
  const consumeFilter = (pattern: RegExp): string[] => {
    pattern.lastIndex = 0;
    const values: string[] = [];

    for (const match of query.matchAll(pattern)) {
      processedQuery = processedQuery.replace(match[0], ' ');
      const value = readFilterValue(match);
      if (value) {
        values.push(value);
      }
    }

    return values;
  };

  const dataSourceNames = consumeFilter(FILTER_PATTERNS.datasource);
  if (dataSourceNames.length > 0) {
    filter.dataSourceNames = dataSourceNames;
  }

  const labels = consumeFilter(FILTER_PATTERNS.label);
  if (labels.length > 0) {
    filter.labels = labels;
  }

  const [namespace] = consumeFilter(FILTER_PATTERNS.namespace);
  if (namespace) {
    filter.namespace = namespace;
  }

  const [groupName] = consumeFilter(FILTER_PATTERNS.group);
  if (groupName) {
    filter.groupName = groupName;
  }

  const [ruleName] = consumeFilter(FILTER_PATTERNS.rule);
  if (ruleName) {
    filter.ruleName = ruleName;
  }

  const [ruleState] = consumeFilter(FILTER_PATTERNS.state);
  if (ruleState) {
    filter.ruleState = ruleState;
  }

  const [ruleType] = consumeFilter(FILTER_PATTERNS.type);
  if (ruleType) {
    filter.ruleType = ruleType;
  }

  const freeText = normalizeFreeText(processedQuery);
  if (!filter.ruleName && freeText) {
    filter.ruleName = freeText;
  }

  return filter;
}

/**
 * Convert a RulesFilter object back to a search query string.
 */
export function applySearchFilterToQuery(filter: RulesFilter): string {
  const parts: string[] = [];

  filter.dataSourceNames?.forEach((dataSourceName) => {
    parts.push(`datasource:${formatValue(dataSourceName)}`);
  });

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

  filter.labels?.forEach((label) => {
    parts.push(`label:${formatValue(label)}`);
  });

  return parts.join(' ');
}
