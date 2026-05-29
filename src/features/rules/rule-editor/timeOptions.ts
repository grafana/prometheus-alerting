import type { ComboboxOption } from '@grafana/ui';

// Time unit options for duration fields (e.g., pending period, keep firing for)
export const timeOptions: Array<ComboboxOption<string>> = [
  { label: 'seconds', value: 's' },
  { label: 'minutes', value: 'm' },
  { label: 'hours', value: 'h' },
  { label: 'days', value: 'd' },
  { label: 'weeks', value: 'w' },
];
