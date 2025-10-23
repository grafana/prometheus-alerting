import type { SelectableValue } from '@grafana/data';

// Time unit options for duration fields (e.g., pending period, keep firing for)
export const timeOptions: Array<SelectableValue<string>> = [
  { label: 'seconds', value: 's' },
  { label: 'minutes', value: 'm' },
  { label: 'hours', value: 'h' },
  { label: 'days', value: 'd' },
  { label: 'weeks', value: 'w' },
];
