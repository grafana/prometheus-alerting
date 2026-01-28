import { dump as yamlDump } from 'js-yaml';

import type { RulerRuleDTO } from '@grafana/external-rules/vanilla';

import { ExportFormat } from './providers';

/**
 * Serializes a RulerRuleDTO to the specified format (YAML or JSON).
 * The output matches the Prometheus/Mimir alerting rule format.
 */
export function serializeRule(rule: RulerRuleDTO, format: ExportFormat): string {
  switch (format) {
    case 'yaml':
      return yamlDump(rule, {
        indent: 2,
        lineWidth: -1, // Disable line wrapping
        noRefs: true,
        sortKeys: false,
      });
    case 'json':
      return JSON.stringify(rule, null, 2);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Generates a filename for the exported rule.
 */
export function generateExportFilename(ruleName: string, format: ExportFormat): string {
  // Sanitize the rule name for use in a filename
  const sanitized = ruleName
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();

  const timestamp = Date.now();
  return `${sanitized}-${timestamp}.${format}`;
}
