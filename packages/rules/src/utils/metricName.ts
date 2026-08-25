/**
 * A recording rule's name becomes the name of the metric it writes. Mimir (and Prometheus, and
 * Loki) only accept metric names made of letters, digits, underscores and colons, and they can't
 * start with a digit -- as long as the tenant is on Mimir's default name-validation setting.
 * Mimir also has an experimental per-tenant setting that only requires valid UTF-8, which would
 * make this check too strict, but there's no API a normal tenant can call to tell which mode is
 * active, and the experimental setting is off by default, so we check against the default.
 */
const METRIC_NAME_PATTERN = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/;

export function isValidMetricName(name: string): boolean {
  return METRIC_NAME_PATTERN.test(name);
}
