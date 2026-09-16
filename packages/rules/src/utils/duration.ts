/**
 * Reading Prometheus durations.
 *
 * ⚠️ There is a meaningful difference between a "Golang duration", which `time.ParseDuration()`
 * reads, and a "Prometheus duration", which is similar but doesn't support anything smaller than
 * milliseconds and adds the units "d, w, y".
 *
 * This lives in the package rather than in the app so that query hashing can use it - the app's
 * `src/utils/time.utils.ts` re-exports everything here, so app code can keep importing from there.
 */

const PROMETHEUS_SUFFIX_MULTIPLIER: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
  y: 365 * 24 * 60 * 60 * 1000,
};

/** The units a Prometheus duration can use, largest first. */
const PROMETHEUS_DURATION_UNITS = ['y', 'w', 'd', 'h', 'm', 's', 'ms'] as const;

// ⚠️ Keep this a bare regex literal. Wrapping it in `new RegExp(...)` looks harmless, but the
// build compiles down to a target without named capture groups and swaps the literal for a
// polyfill object that supplies `.groups` itself. `new RegExp(someRegex)` copies the pattern out
// of that object's internals, losing the polyfill — so `.groups` comes back undefined in the
// browser and every duration below is rejected as invalid. Tests don't compile down that far, so
// they can't catch it.
const DURATION_REGEXP = /^(?:(?<value>\d+)(?<type>ms|s|m|h|d|w|y))|0$/;
const INVALID_FORMAT = new Error(
  `Must be of format "(number)(unit)", for example "1m", or just "0". Available units: ${PROMETHEUS_DURATION_UNITS.join(
    ', '
  )}`
);

/**
 * According to https://prometheus.io/docs/alerting/latest/configuration/#configuration-file
 * see <duration>
 *
 * @returns Duration in milliseconds
 */
export function parsePrometheusDuration(duration: string): number {
  let input = duration;
  const parts: Array<[number, string]> = [];

  function matchDuration(part: string) {
    const match = DURATION_REGEXP.exec(part);
    const hasValueAndType = match?.groups?.value && match?.groups?.type;

    if (!match || !hasValueAndType) {
      throw INVALID_FORMAT;
    }

    if (match && match.groups?.value && match.groups?.type) {
      input = input.replace(match[0], '');
      parts.push([Number(match.groups.value), match.groups.type]);
    }

    if (input) {
      matchDuration(input);
    }
  }

  matchDuration(duration);

  if (!parts.length) {
    throw INVALID_FORMAT;
  }

  const totalDuration = parts.reduce((acc, [value, type]) => {
    const duration = value * PROMETHEUS_SUFFIX_MULTIPLIER[type];
    return acc + duration;
  }, 0);

  return totalDuration;
}

export function isValidPrometheusDuration(duration: string): boolean {
  try {
    parsePrometheusDuration(duration);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Parses a Prometheus duration string and returns the duration in milliseconds.
 * If the duration is invalid, it returns 0.
 *
 * @param duration - The Prometheus duration string to parse.
 * @returns The duration in milliseconds.
 */
export const safeParsePrometheusDuration = (duration: string): number => {
  try {
    return parsePrometheusDuration(duration);
  } catch (e) {
    return 0;
  }
};
