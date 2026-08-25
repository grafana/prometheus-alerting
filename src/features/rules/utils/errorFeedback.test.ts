import { getRulesErrorFeedback } from './errorFeedback';

describe('getRulesErrorFeedback', () => {
  it('returns permission feedback for a forbidden datasource request', () => {
    const feedback = getRulesErrorFeedback({ status: 403, data: {} }, 'Failed to load rules');

    expect(feedback.title).toBe('Permission denied');
    expect(feedback.description).toBe('You do not have permission to access rules from this data source.');
  });

  it('returns the ruler response verbatim, without stripping or splitting anything', () => {
    const message =
      '10:13: group "g", rule 1, "a": invalid recording rule name: a, 14:9: group "g", rule 2, "b": invalid label name: b';

    const feedback = getRulesErrorFeedback({ status: 400, data: message }, 'Failed to save rule');

    expect(feedback.title).toBe('Failed to save rule');
    expect(feedback.description).toBe(message);
  });

  it('trims surrounding whitespace but leaves the message otherwise untouched', () => {
    const feedback = getRulesErrorFeedback({ status: 400, data: '  ruler API is not enabled  \n' }, 'Failed');

    expect(feedback.description).toBe('ruler API is not enabled');
  });

  it('falls back to an unknown-error message when there is nothing to show', () => {
    const feedback = getRulesErrorFeedback({ status: 400, data: '   ' }, 'Failed to save rule');

    expect(feedback.description).toBe('An unknown error occurred');
  });
});
