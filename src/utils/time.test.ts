import { formatPrometheusDuration } from './time';

describe('formatPrometheusDuration', () => {
  it('returns "0s" for zero milliseconds', () => {
    expect(formatPrometheusDuration(0)).toBe('0s');
  });

  it('formats plain seconds', () => {
    expect(formatPrometheusDuration(30_000)).toBe('30s');
  });

  it('formats minutes', () => {
    expect(formatPrometheusDuration(2 * 60 * 1000)).toBe('2m');
  });

  it('formats hours', () => {
    expect(formatPrometheusDuration(3 * 60 * 60 * 1000)).toBe('3h');
  });

  it('formats days', () => {
    expect(formatPrometheusDuration(2 * 24 * 60 * 60 * 1000)).toBe('2d');
  });

  it('formats weeks', () => {
    expect(formatPrometheusDuration(2 * 7 * 24 * 60 * 60 * 1000)).toBe('2w');
  });

  it('formats years', () => {
    expect(formatPrometheusDuration(365 * 24 * 60 * 60 * 1000)).toBe('1y');
  });

  it('formats combined units', () => {
    // 1h 30m
    expect(formatPrometheusDuration(90 * 60 * 1000)).toBe('1h30m');
  });

  it('formats millisecond remainder', () => {
    expect(formatPrometheusDuration(1500)).toBe('1s500ms');
  });

  it('formats pure milliseconds under 1 second', () => {
    expect(formatPrometheusDuration(250)).toBe('250ms');
  });
});
