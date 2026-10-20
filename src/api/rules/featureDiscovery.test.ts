import { errorIndicatesMissingRulerSupport } from './featureDiscovery';

describe('errorIndicatesMissingRulerSupport', () => {
  it.each(['GetRuleGroup unsupported in rule local store', 'page not found', 'ruler API is not enabled'])(
    'recognizes a Ruler API response containing "%s"',
    (message) => {
      expect(errorIndicatesMissingRulerSupport({ data: { message } })).toBe(true);
    }
  );

  it('recognizes a rules config endpoint 404', () => {
    expect(errorIndicatesMissingRulerSupport(new Error('404 from rules config endpoint'))).toBe(true);
  });

  it('does not classify unrelated errors as missing Ruler support', () => {
    expect(errorIndicatesMissingRulerSupport({ data: { message: 'Internal server error' } })).toBe(false);
  });
});
