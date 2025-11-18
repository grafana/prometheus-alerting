import type { ComboboxOption } from '@grafana/ui';

/**
 * List of IANA timezone identifiers commonly used
 * Grouped by region for better usability
 */
export const IANA_TIMEZONES: ComboboxOption[] = [
  // UTC
  { label: 'UTC', value: 'UTC', group: 'UTC' },

  // Africa
  { label: 'Cairo', value: 'Africa/Cairo', group: 'Africa' },
  { label: 'Casablanca', value: 'Africa/Casablanca', group: 'Africa' },
  { label: 'Johannesburg', value: 'Africa/Johannesburg', group: 'Africa' },
  { label: 'Lagos', value: 'Africa/Lagos', group: 'Africa' },
  { label: 'Nairobi', value: 'Africa/Nairobi', group: 'Africa' },

  // America
  { label: 'Anchorage', value: 'America/Anchorage', group: 'America' },
  { label: 'Buenos Aires', value: 'America/Argentina/Buenos_Aires', group: 'America' },
  { label: 'Bogota', value: 'America/Bogota', group: 'America' },
  { label: 'Caracas', value: 'America/Caracas', group: 'America' },
  { label: 'Chicago', value: 'America/Chicago', group: 'America' },
  { label: 'Denver', value: 'America/Denver', group: 'America' },
  { label: 'Los Angeles', value: 'America/Los_Angeles', group: 'America' },
  { label: 'Mexico City', value: 'America/Mexico_City', group: 'America' },
  { label: 'New York', value: 'America/New_York', group: 'America' },
  { label: 'Phoenix', value: 'America/Phoenix', group: 'America' },
  { label: 'Santiago', value: 'America/Santiago', group: 'America' },
  { label: 'Sao Paulo', value: 'America/Sao_Paulo', group: 'America' },
  { label: 'Toronto', value: 'America/Toronto', group: 'America' },
  { label: 'Vancouver', value: 'America/Vancouver', group: 'America' },

  // Asia
  { label: 'Bangkok', value: 'Asia/Bangkok', group: 'Asia' },
  { label: 'Dhaka', value: 'Asia/Dhaka', group: 'Asia' },
  { label: 'Dubai', value: 'Asia/Dubai', group: 'Asia' },
  { label: 'Hong Kong', value: 'Asia/Hong_Kong', group: 'Asia' },
  { label: 'Jakarta', value: 'Asia/Jakarta', group: 'Asia' },
  { label: 'Jerusalem', value: 'Asia/Jerusalem', group: 'Asia' },
  { label: 'Karachi', value: 'Asia/Karachi', group: 'Asia' },
  { label: 'Kolkata', value: 'Asia/Kolkata', group: 'Asia' },
  { label: 'Manila', value: 'Asia/Manila', group: 'Asia' },
  { label: 'Seoul', value: 'Asia/Seoul', group: 'Asia' },
  { label: 'Shanghai', value: 'Asia/Shanghai', group: 'Asia' },
  { label: 'Singapore', value: 'Asia/Singapore', group: 'Asia' },
  { label: 'Taipei', value: 'Asia/Taipei', group: 'Asia' },
  { label: 'Tehran', value: 'Asia/Tehran', group: 'Asia' },
  { label: 'Tokyo', value: 'Asia/Tokyo', group: 'Asia' },

  // Atlantic
  { label: 'Azores', value: 'Atlantic/Azores', group: 'Atlantic' },
  { label: 'Reykjavik', value: 'Atlantic/Reykjavik', group: 'Atlantic' },

  // Australia
  { label: 'Adelaide', value: 'Australia/Adelaide', group: 'Australia' },
  { label: 'Brisbane', value: 'Australia/Brisbane', group: 'Australia' },
  { label: 'Melbourne', value: 'Australia/Melbourne', group: 'Australia' },
  { label: 'Perth', value: 'Australia/Perth', group: 'Australia' },
  { label: 'Sydney', value: 'Australia/Sydney', group: 'Australia' },

  // Europe
  { label: 'Amsterdam', value: 'Europe/Amsterdam', group: 'Europe' },
  { label: 'Athens', value: 'Europe/Athens', group: 'Europe' },
  { label: 'Berlin', value: 'Europe/Berlin', group: 'Europe' },
  { label: 'Brussels', value: 'Europe/Brussels', group: 'Europe' },
  { label: 'Bucharest', value: 'Europe/Bucharest', group: 'Europe' },
  { label: 'Budapest', value: 'Europe/Budapest', group: 'Europe' },
  { label: 'Copenhagen', value: 'Europe/Copenhagen', group: 'Europe' },
  { label: 'Dublin', value: 'Europe/Dublin', group: 'Europe' },
  { label: 'Helsinki', value: 'Europe/Helsinki', group: 'Europe' },
  { label: 'Istanbul', value: 'Europe/Istanbul', group: 'Europe' },
  { label: 'Kiev', value: 'Europe/Kiev', group: 'Europe' },
  { label: 'Lisbon', value: 'Europe/Lisbon', group: 'Europe' },
  { label: 'London', value: 'Europe/London', group: 'Europe' },
  { label: 'Madrid', value: 'Europe/Madrid', group: 'Europe' },
  { label: 'Moscow', value: 'Europe/Moscow', group: 'Europe' },
  { label: 'Oslo', value: 'Europe/Oslo', group: 'Europe' },
  { label: 'Paris', value: 'Europe/Paris', group: 'Europe' },
  { label: 'Prague', value: 'Europe/Prague', group: 'Europe' },
  { label: 'Rome', value: 'Europe/Rome', group: 'Europe' },
  { label: 'Stockholm', value: 'Europe/Stockholm', group: 'Europe' },
  { label: 'Vienna', value: 'Europe/Vienna', group: 'Europe' },
  { label: 'Warsaw', value: 'Europe/Warsaw', group: 'Europe' },
  { label: 'Zurich', value: 'Europe/Zurich', group: 'Europe' },

  // Pacific
  { label: 'Auckland', value: 'Pacific/Auckland', group: 'Pacific' },
  { label: 'Fiji', value: 'Pacific/Fiji', group: 'Pacific' },
  { label: 'Guam', value: 'Pacific/Guam', group: 'Pacific' },
  { label: 'Honolulu', value: 'Pacific/Honolulu', group: 'Pacific' },
  { label: 'Pago Pago', value: 'Pacific/Pago_Pago', group: 'Pacific' },
] as const;
