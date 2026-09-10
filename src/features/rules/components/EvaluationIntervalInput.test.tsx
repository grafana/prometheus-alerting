import { validateInterval } from './EvaluationIntervalInput';

describe('validateInterval', () => {
  it('accepts a valid interval', () => {
    expect(validateInterval('1m')).toBeUndefined();
  });

  it.each(['bogus99', 'not-a-duration', ''])('rejects an invalid duration format (%s)', (interval) => {
    expect(validateInterval(interval)).toBe('Invalid duration format. Use formats like 1m, 30s, 1h.');
  });

  it.each(['1d', '1w'])('accepts day/week durations (%s)', (interval) => {
    expect(validateInterval(interval)).toBeUndefined();
  });
});
