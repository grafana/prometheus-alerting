/**
 * Formats the given duration in milliseconds into a human-readable string representation.
 *
 * @param milliseconds - The duration in milliseconds.
 * @returns The formatted duration string.
 */
export function formatPrometheusDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const years = Math.floor(days / 365);

  // we'll make an exception here for 0, 0ms seems a bit weird
  if (milliseconds === 0) {
    return '0s';
  }

  const timeUnits: Array<[number, string]> = [
    [years, 'y'],
    [weeks % 52, 'w'],
    [(days % 365) - 7 * (weeks % 52), 'd'],
    [hours % 24, 'h'],
    [minutes % 60, 'm'],
    [seconds % 60, 's'],
    [milliseconds % 1000, 'ms'],
  ];

  return (
    timeUnits
      // remove all 0 values
      .filter(([time]) => time > 0)
      // join time and unit
      .map(([time, unit]) => time + unit)
      .join('')
  );
}
