import { describe, expect, it } from 'vitest';
import { attachRouteIds, isRootRoute } from './utils';

describe('isRootRoute', () => {
  it('identifies only the route with the root tree id as root', () => {
    const root = attachRouteIds({ receiver: 'default', routes: [{ receiver: 'child' }] });

    expect(isRootRoute(root, root)).toBe(true);
    expect(isRootRoute(root.routes![0], root)).toBe(false);
    expect(isRootRoute(root, undefined)).toBe(false);
  });
});

describe('attachRouteIds', () => {
  it('assigns content-hash ids to the root and its children', () => {
    const result = attachRouteIds({ receiver: 'default', routes: [{ receiver: 'a' }, { receiver: 'b' }] });

    expect(result.id).toMatch(/^0-/);
    expect(result.routes![0].id).toMatch(/^0-0-/);
    expect(result.routes![1].id).toMatch(/^0-1-/);
  });

  it('assigns stable ids for the same raw route content', () => {
    const route = { receiver: 'default', routes: [{ receiver: 'a' }] };

    const first = attachRouteIds(route);
    const second = attachRouteIds(route);

    expect(first.id).toBe(second.id);
    expect(first.routes![0].id).toBe(second.routes![0].id);
  });

  it('defaults `continue` without changing other fields', () => {
    const result = attachRouteIds({ receiver: 'default', matchers: ['foo=bar'] });

    expect(result.continue).toBe(false);
    expect(result.receiver).toBe('default');
    expect(result.matchers).toEqual(['foo=bar']);
  });

  it('returns empty routes array when there are no children', () => {
    const result = attachRouteIds({ receiver: 'default' });

    expect(result.routes).toEqual([]);
  });
});
