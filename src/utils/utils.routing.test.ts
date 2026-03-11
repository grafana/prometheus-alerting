import { prefixRoute } from './utils.routing';
import { PLUGIN_BASE_URL } from '../constants';

describe('prefixRoute', () => {
  it('prefixes a route with the plugin base URL', () => {
    expect(prefixRoute('alerts')).toBe(`${PLUGIN_BASE_URL}/alerts`);
  });

  it('handles nested routes', () => {
    expect(prefixRoute('rules/new')).toBe(`${PLUGIN_BASE_URL}/rules/new`);
  });

  it('handles empty string', () => {
    expect(prefixRoute('')).toBe(`${PLUGIN_BASE_URL}/`);
  });
});
