import { Route } from '@grafana/external-alertmanager/vanilla';
import { RouteWithID } from '@grafana/external-alertmanager/mimir';

import { MatcherOperator, FormAmRoute } from '../types';
import {
  addRouteToTree,
  amRouteToFormAmRoute,
  formAmRouteToAmRoute,
  mergeRouteIntoTree,
  isValidPromDuration,
  removeRouteFromTree,
} from './routeTransform';

describe('amRouteToFormAmRoute', () => {
  it('returns empty route for undefined input', () => {
    const result = amRouteToFormAmRoute(undefined);

    expect(result.id).toBe('');
    expect(result.object_matchers).toEqual([]);
    expect(result.receiver).toBe('');
    expect(result.continue).toBe(false);
  });

  it('converts basic route properties', () => {
    const route: Route = {
      receiver: 'slack-notifications',
      continue: true,
      group_by: ['alertname', 'severity'],
      group_wait: '30s',
      group_interval: '5m',
      repeat_interval: '4h',
    };

    const result = amRouteToFormAmRoute(route);

    expect(result.receiver).toBe('slack-notifications');
    expect(result.continue).toBe(true);
    expect(result.overrideGrouping).toBe(true);
    expect(result.groupBy).toEqual(['alertname', 'severity']);
    expect(result.overrideTimings).toBe(true);
    expect(result.groupWaitValue).toBe('30s');
    expect(result.groupIntervalValue).toBe('5m');
    expect(result.repeatIntervalValue).toBe('4h');
  });

  it('parses matchers from string format', () => {
    const route: Route = {
      matchers: ['severity=critical', 'team!=backend', 'region=~us-.*'],
    };

    const result = amRouteToFormAmRoute(route);

    expect(result.object_matchers).toHaveLength(3);
    expect(result.object_matchers[0]).toEqual({
      name: 'severity',
      operator: MatcherOperator.equal,
      value: 'critical',
    });
    expect(result.object_matchers[1]).toEqual({
      name: 'team',
      operator: MatcherOperator.notEqual,
      value: 'backend',
    });
    expect(result.object_matchers[2]).toEqual({
      name: 'region',
      operator: MatcherOperator.regex,
      value: 'us-.*',
    });
  });

  it('preserves route ID from RouteWithID', () => {
    const route: RouteWithID = {
      id: 'route-123',
      receiver: 'webhook',
    };

    const result = amRouteToFormAmRoute(route);

    expect(result.id).toBe('route-123');
  });

  it('converts child routes recursively', () => {
    const route: Route = {
      receiver: 'default',
      routes: [{ receiver: 'child-1' }, { receiver: 'child-2' }],
    };

    const result = amRouteToFormAmRoute(route);

    expect(result.routes).toHaveLength(2);
    expect(result.routes[0].receiver).toBe('child-1');
    expect(result.routes[1].receiver).toBe('child-2');
  });
});

describe('formAmRouteToAmRoute', () => {
  it('converts basic form values to route', () => {
    const form: Partial<FormAmRoute> = {
      receiver: 'slack',
      continue: true,
      overrideGrouping: true,
      groupBy: ['alertname'],
      overrideTimings: true,
      groupWaitValue: '1m',
      groupIntervalValue: '5m',
      repeatIntervalValue: '1h',
    };

    const result = formAmRouteToAmRoute(form);

    expect(result.receiver).toBe('slack');
    expect(result.continue).toBe(true);
    expect(result.group_by).toEqual(['alertname']);
    expect(result.group_wait).toBe('1m');
    expect(result.group_interval).toBe('5m');
    expect(result.repeat_interval).toBe('1h');
  });

  it('omits timing values when overrideTimings is false', () => {
    const form: Partial<FormAmRoute> = {
      receiver: 'slack',
      overrideTimings: false,
      groupWaitValue: '1m',
      groupIntervalValue: '5m',
      repeatIntervalValue: '1h',
    };

    const result = formAmRouteToAmRoute(form);

    expect(result.group_wait).toBeUndefined();
    expect(result.group_interval).toBeUndefined();
    expect(result.repeat_interval).toBeUndefined();
  });

  it('converts matchers to string format', () => {
    const form: Partial<FormAmRoute> = {
      object_matchers: [
        { name: 'severity', operator: MatcherOperator.equal, value: 'critical' },
        { name: 'team', operator: MatcherOperator.regex, value: 'platform.*' },
      ],
    };

    const result = formAmRouteToAmRoute(form);

    expect(result.matchers).toEqual(['severity=critical', 'team=~platform.*']);
  });

  it('filters out matchers without a name', () => {
    const form: Partial<FormAmRoute> = {
      object_matchers: [
        { name: 'valid', operator: MatcherOperator.equal, value: 'yes' },
        { name: '', operator: MatcherOperator.equal, value: 'ignored' },
      ],
    };

    const result = formAmRouteToAmRoute(form);

    expect(result.matchers).toEqual(['valid=yes']);
  });
});

describe('mergeRouteIntoTree', () => {
  it('updates a route by ID in a flat tree', () => {
    const tree: RouteWithID = {
      id: 'root',
      receiver: 'default',
      routes: [
        { id: 'child-1', receiver: 'slack' } as RouteWithID,
        { id: 'child-2', receiver: 'email' } as RouteWithID,
      ],
    };

    const update: Partial<FormAmRoute> = {
      receiver: 'updated-slack',
    };

    const result = mergeRouteIntoTree(tree, 'child-1', update);

    expect((result.routes![0] as RouteWithID).receiver).toBe('updated-slack');
    expect((result.routes![1] as RouteWithID).receiver).toBe('email');
  });

  it('preserves timing when overrideTimings is true', () => {
    const tree: RouteWithID = {
      id: 'root',
      receiver: 'default',
    };

    const update: Partial<FormAmRoute> = {
      receiver: 'new-receiver',
      overrideTimings: true,
      groupWaitValue: '30s',
      groupIntervalValue: '5m',
      repeatIntervalValue: '1h',
    };

    const result = mergeRouteIntoTree(tree, 'root', update);

    expect(result.receiver).toBe('new-receiver');
    expect(result.group_wait).toBe('30s');
    expect(result.group_interval).toBe('5m');
    expect(result.repeat_interval).toBe('1h');
  });

  it('clears timing values when overrideTimings is false (inherit from parent)', () => {
    const tree: RouteWithID = {
      id: 'root',
      receiver: 'default',
      group_wait: '30s',
    };

    const update: Partial<FormAmRoute> = {
      receiver: 'new-receiver',
      overrideTimings: false,
    };

    const result = mergeRouteIntoTree(tree, 'root', update);

    expect(result.receiver).toBe('new-receiver');
    // Timing values are undefined when not overriding (inherit from parent)
    expect(result.group_wait).toBeUndefined();
  });

  // Regression test for a real bug: `getUserConfiguration`/`getConfiguration` return a plain
  // `Route` per `RoutesSchema`, which has no `id` field at all — routeIds must be reconstructed
  // positionally to match `addUniqueIdentifier`'s scheme. A tree with explicit ids (like the
  // fixtures above) never exercises that fallback and would not have caught the dash/dot mismatch
  // that silently no-opped edits on any non-root route.
  it('updates a non-root route in a tree with no explicit ids (real fetched-config shape)', () => {
    const tree: Route = {
      receiver: 'default',
      routes: [{ receiver: 'slack' }, { receiver: 'email' }],
    };

    const result = mergeRouteIntoTree(tree, '0.1', { receiver: 'updated-email' });

    expect(result.routes![0].receiver).toBe('slack');
    expect(result.routes![1].receiver).toBe('updated-email');
  });

  it('updates a nested (grandchild) route in a tree with no explicit ids', () => {
    const tree: Route = {
      receiver: 'default',
      routes: [
        {
          receiver: 'team-a',
          routes: [{ receiver: 'team-a-critical' }, { receiver: 'team-a-warning' }],
        },
      ],
    };

    const result = mergeRouteIntoTree(tree, '0.0.1', { receiver: 'team-a-warning-updated' });

    expect(result.routes![0].routes![0].receiver).toBe('team-a-critical');
    expect(result.routes![0].routes![1].receiver).toBe('team-a-warning-updated');
  });
});

describe('addRouteToTree', () => {
  it('adds a child to a non-root route in a tree with no explicit ids', () => {
    const tree: Route = {
      receiver: 'default',
      routes: [{ receiver: 'team-a' }, { receiver: 'team-b' }],
    };

    const result = addRouteToTree(tree, '0.0', { receiver: 'team-a-child' }, 'child');

    expect(result.routes![0].routes).toHaveLength(1);
    expect(result.routes![0].routes![0].receiver).toBe('team-a-child');
    // Sibling untouched
    expect(result.routes![1].routes).toBeUndefined();
  });

  it('adds a sibling below a non-root route in a tree with no explicit ids', () => {
    const tree: Route = {
      receiver: 'default',
      routes: [{ receiver: 'team-a' }, { receiver: 'team-b' }],
    };

    const result = addRouteToTree(tree, '0.0', { receiver: 'new-sibling' }, 'below');

    expect(result.routes).toHaveLength(3);
    expect(result.routes!.map((r) => r.receiver)).toEqual(['team-a', 'new-sibling', 'team-b']);
  });

  it('adds a sibling above a non-root route in a tree with no explicit ids', () => {
    const tree: Route = {
      receiver: 'default',
      routes: [{ receiver: 'team-a' }, { receiver: 'team-b' }],
    };

    const result = addRouteToTree(tree, '0.1', { receiver: 'new-sibling' }, 'above');

    expect(result.routes!.map((r) => r.receiver)).toEqual(['team-a', 'new-sibling', 'team-b']);
  });

  it('adds a child to the root route', () => {
    const tree: Route = { receiver: 'default' };

    const result = addRouteToTree(tree, '0', { receiver: 'child' }, 'child');

    expect(result.routes).toHaveLength(1);
    expect(result.routes![0].receiver).toBe('child');
  });

  it('throws when the reference route is not found', () => {
    const tree: Route = { receiver: 'default', routes: [{ receiver: 'team-a' }] };

    expect(() => addRouteToTree(tree, '0.5', { receiver: 'x' }, 'child')).toThrow(
      'Could not find reference route "0.5" in tree'
    );
  });
});

describe('isValidPromDuration', () => {
  it('accepts valid duration formats', () => {
    expect(isValidPromDuration('30s')).toBe(true);
    expect(isValidPromDuration('5m')).toBe(true);
    expect(isValidPromDuration('1h')).toBe(true);
    expect(isValidPromDuration('1h30m')).toBe(true);
    expect(isValidPromDuration('1d')).toBe(true);
    expect(isValidPromDuration('1w')).toBe(true);
  });

  it('accepts empty string (inherit from parent)', () => {
    expect(isValidPromDuration('')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(isValidPromDuration('invalid')).toBe(false);
    expect(isValidPromDuration('30')).toBe(false);
    expect(isValidPromDuration('m5')).toBe(false);
    expect(isValidPromDuration('5 m')).toBe(false);
  });
});

describe('removeRouteFromTree', () => {
  it('removes a child route from a flat tree', () => {
    const tree: RouteWithID = {
      id: '0',
      receiver: 'default',
      routes: [
        { id: '0.0', receiver: 'slack' } as RouteWithID,
        { id: '0.1', receiver: 'email' } as RouteWithID,
        { id: '0.2', receiver: 'webhook' } as RouteWithID,
      ],
    };

    const result = removeRouteFromTree(tree, '0.1');

    expect(result.routes).toHaveLength(2);
    expect((result.routes![0] as RouteWithID).id).toBe('0.0');
    expect((result.routes![1] as RouteWithID).id).toBe('0.2');
  });

  it('removes a nested child route', () => {
    const tree: RouteWithID = {
      id: '0',
      receiver: 'default',
      routes: [
        {
          id: '0.0',
          receiver: 'team-a',
          routes: [
            { id: '0.0.0', receiver: 'team-a-critical' } as RouteWithID,
            { id: '0.0.1', receiver: 'team-a-warning' } as RouteWithID,
          ],
        } as RouteWithID,
        { id: '0.1', receiver: 'team-b' } as RouteWithID,
      ],
    };

    const result = removeRouteFromTree(tree, '0.0.0');

    // Team A route should still exist with only one child
    const teamARoute = result.routes![0] as RouteWithID;
    expect(teamARoute.routes).toHaveLength(1);
    expect((teamARoute.routes![0] as RouteWithID).id).toBe('0.0.1');
  });

  it('removes a route with all its children', () => {
    const tree: RouteWithID = {
      id: '0',
      receiver: 'default',
      routes: [
        {
          id: '0.0',
          receiver: 'team-a',
          routes: [
            { id: '0.0.0', receiver: 'team-a-critical' } as RouteWithID,
            { id: '0.0.1', receiver: 'team-a-warning' } as RouteWithID,
          ],
        } as RouteWithID,
        { id: '0.1', receiver: 'team-b' } as RouteWithID,
      ],
    };

    // Remove the entire team-a route (and its children)
    const result = removeRouteFromTree(tree, '0.0');

    expect(result.routes).toHaveLength(1);
    expect((result.routes![0] as RouteWithID).id).toBe('0.1');
  });

  it('throws error when trying to delete root route', () => {
    const tree: RouteWithID = {
      id: '0',
      receiver: 'default',
    };

    expect(() => removeRouteFromTree(tree, '0')).toThrow('Cannot delete the root route');
  });

  it('throws error when route not found', () => {
    const tree: RouteWithID = {
      id: '0',
      receiver: 'default',
      routes: [{ id: '0.0', receiver: 'slack' } as RouteWithID],
    };

    expect(() => removeRouteFromTree(tree, 'nonexistent')).toThrow('Could not find route "nonexistent" in tree');
  });

  it('sets routes to undefined when last child is removed', () => {
    const tree: RouteWithID = {
      id: '0',
      receiver: 'default',
      routes: [{ id: '0.0', receiver: 'slack' } as RouteWithID],
    };

    const result = removeRouteFromTree(tree, '0.0');

    expect(result.routes).toBeUndefined();
  });
});
