// Check if a data source type supports external rules (Prometheus-compatible)
export function isSupportedExternalRulesSourceType(type: string): boolean {
  const supportedTypes = ['prometheus', 'loki', 'mimir', 'cortex'];
  return supportedTypes.includes(type.toLowerCase());
}
