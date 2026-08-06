import { describe, it, expect } from 'vitest';
import type { GettableSilence } from '@grafana/external-alertmanager/vanilla';
import { formatMatchers, formatDateTime, formatDateTimeLocal } from './silences.utils';

const makeSilence = (matchers: GettableSilence['matchers']): GettableSilence =>
  ({
    matchers,
  }) as GettableSilence;

describe('formatMatchers', () => {
  it('formats an equal matcher', () => {
    const result = formatMatchers(makeSilence([{ name: 'foo', value: 'bar', isEqual: true, isRegex: false }]));
    expect(result).toEqual(['foo="bar"']);
  });

  it('formats a not-equal matcher', () => {
    const result = formatMatchers(makeSilence([{ name: 'foo', value: 'bar', isEqual: false, isRegex: false }]));
    expect(result).toEqual(['foo!="bar"']);
  });

  it('formats a regex matcher', () => {
    const result = formatMatchers(makeSilence([{ name: 'foo', value: 'bar.*', isEqual: true, isRegex: true }]));
    expect(result).toEqual(['foo=~"bar.*"']);
  });

  it('formats a not-regex matcher', () => {
    const result = formatMatchers(makeSilence([{ name: 'foo', value: 'bar.*', isEqual: false, isRegex: true }]));
    expect(result).toEqual(['foo!~"bar.*"']);
  });

  it('formats multiple matchers', () => {
    const result = formatMatchers(
      makeSilence([
        { name: 'env', value: 'prod', isEqual: true, isRegex: false },
        { name: 'job', value: 'api.*', isEqual: true, isRegex: true },
      ])
    );
    expect(result).toEqual(['env="prod"', 'job=~"api.*"']);
  });
});

describe('formatDateTime', () => {
  it('returns a non-empty string for a valid date', () => {
    const result = formatDateTime('2024-01-15T10:30:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes the year in the output', () => {
    const result = formatDateTime('2024-01-15T10:30:00Z');
    expect(result).toContain('2024');
  });
});

describe('formatDateTimeLocal', () => {
  it('formats local time as expected by a datetime-local input', () => {
    // Constructed from local components so the expectation holds in any timezone.
    expect(formatDateTimeLocal(new Date(2024, 0, 15, 10, 30))).toBe('2024-01-15T10:30');
  });

  it('pads single-digit month, day, hour and minute', () => {
    expect(formatDateTimeLocal(new Date(2024, 8, 5, 9, 5))).toBe('2024-09-05T09:05');
  });
});
