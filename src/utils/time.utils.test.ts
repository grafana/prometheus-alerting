 
import {
  formatPrometheusDuration,
  isValidPrometheusDuration,
  parsePrometheusDuration,
  parseInterval,
  safeParsePrometheusDuration,
  isNullDate,
  msToSingleUnitDuration,
  timeOptions,
} from './time.utils';

describe('isValidPrometheusDuration', () => {
  const validDurations = ['20h30m10s45ms', '1m30s', '20s4h', '90s', '10s', '20h20h', '2d4h20m'];

  it.each(validDurations)('%s should be valid', (duration) => {
    expect(isValidPrometheusDuration(duration)).toBe(true);
  });

  const invalidDurations = ['20h 30m 10s 45ms', '10Y', 'sample text', 'm', '', '-1h', '1.5h', '0'];

  it.each(invalidDurations)('%s should NOT be valid', (duration) => {
    expect(isValidPrometheusDuration(duration)).toBe(false);
  });
});

describe('parsePrometheusDuration', () => {
  const tests: Array<[string, number]> = [
    ['1ms', 1],
    ['1s', 1000],
    ['1m', 1000 * 60],
    ['1h', 1000 * 60 * 60],
    ['1d', 1000 * 60 * 60 * 24],
    ['1w', 1000 * 60 * 60 * 24 * 7],
    ['1y', 1000 * 60 * 60 * 24 * 365],
    ['1d10h17m36s789ms', 123456789],
    ['1w4d10h20m54s321ms', 987654321],
    ['1y1w1d1h1m1s1ms', 32230861001],
  ];
  test.each(tests)('.parsePrometheusDuration(%s)', (input, expected) => {
    expect(parsePrometheusDuration(input)).toBe(expected);
  });
});

describe('formatPrometheusDuration', () => {
  it('should return "0s" for 0 milliseconds', () => {
    const result = formatPrometheusDuration(0);
    expect(result).toBe('0s');
  });

  const tests: Array<[number, string]> = [
    [0, '0s'],
    [1, '1ms'],
    [100, '100ms'],
    [1000, '1s'],
    [60000, '1m'],
    [3600000, '1h'],
    [86400000, '1d'],
    [604800000, '1w'],
    [31536000000, '1y'],
    [123456789, '1d10h17m36s789ms'],
    [987654321, '1w4d10h20m54s321ms'],
    [32230861001, '1y1w1d1h1m1s1ms'],
  ];
  test.each(tests)('.formatPrometheusDuration(%s)', (input, expected) => {
    expect(formatPrometheusDuration(input)).toBe(expected);
  });
});

describe('parseInterval', () => {
  it('should parse valid interval strings', () => {
    expect(parseInterval('5m')).toEqual([5, 'm']);
    expect(parseInterval('10h')).toEqual([10, 'h']);
    expect(parseInterval('30s')).toEqual([30, 's']);
    expect(parseInterval('1d')).toEqual([1, 'd']);
  });

  it('should throw error for invalid interval strings', () => {
    expect(() => parseInterval('invalid')).toThrow('Invalid interval description: invalid');
    expect(() => parseInterval('')).toThrow('Invalid interval description: ');
    expect(() => parseInterval('m')).toThrow('Invalid interval description: m');
  });
});

describe('safeParsePrometheusDuration', () => {
  it('should return duration in milliseconds for valid durations', () => {
    expect(safeParsePrometheusDuration('1h')).toBe(3600000);
    expect(safeParsePrometheusDuration('30m')).toBe(1800000);
    expect(safeParsePrometheusDuration('2h30m')).toBe(9000000);
  });

  it('should return 0 for invalid durations', () => {
    expect(safeParsePrometheusDuration('invalid')).toBe(0);
    expect(safeParsePrometheusDuration('')).toBe(0);
    expect(safeParsePrometheusDuration('10Y')).toBe(0);
    expect(safeParsePrometheusDuration('-1h')).toBe(0);
  });
});

describe('isNullDate', () => {
  it('should return true for null dates', () => {
    expect(isNullDate('0001-01-01T00:00:00Z')).toBe(true);
    expect(isNullDate('0001-01-01T00:00:00')).toBe(true);
    expect(isNullDate('0001-01-01T00:00:00.000Z')).toBe(true);
  });

  it('should return false for valid dates', () => {
    expect(isNullDate('2024-01-01T00:00:00Z')).toBe(false);
    expect(isNullDate('2023-12-31T23:59:59Z')).toBe(false);
    expect(isNullDate('')).toBe(false);
  });
});

describe('msToSingleUnitDuration', () => {
  it('should format to hours when evenly divisible', () => {
    expect(msToSingleUnitDuration(3600000)).toBe('1h');
    expect(msToSingleUnitDuration(7200000)).toBe('2h');
    expect(msToSingleUnitDuration(36000000)).toBe('10h');
  });

  it('should format to minutes when evenly divisible', () => {
    expect(msToSingleUnitDuration(60000)).toBe('1m');
    expect(msToSingleUnitDuration(300000)).toBe('5m');
    expect(msToSingleUnitDuration(1800000)).toBe('30m');
  });

  it('should format to seconds when evenly divisible', () => {
    expect(msToSingleUnitDuration(1000)).toBe('1s');
    expect(msToSingleUnitDuration(30000)).toBe('30s');
    expect(msToSingleUnitDuration(90000)).toBe('90s');
  });

  it('should format to milliseconds when not evenly divisible', () => {
    expect(msToSingleUnitDuration(1500)).toBe('1500ms');
    expect(msToSingleUnitDuration(100)).toBe('100ms');
    expect(msToSingleUnitDuration(2500)).toBe('2500ms');
  });

  it('should handle zero', () => {
    expect(msToSingleUnitDuration(0)).toBe('0h');
  });
});

describe('timeOptions', () => {
  it('should have correct structure', () => {
    expect(timeOptions).toEqual([
      { label: 'Seconds', value: 's' },
      { label: 'Minutes', value: 'm' },
      { label: 'Hours', value: 'h' },
      { label: 'Days', value: 'd' },
      { label: 'Weeks', value: 'w' },
    ]);
  });

  it('should have all TimeOptions enum values', () => {
    const values = timeOptions.map((opt) => opt.value);
    expect(values).toContain('s');
    expect(values).toContain('m');
    expect(values).toContain('h');
    expect(values).toContain('d');
    expect(values).toContain('w');
  });
});
