import { Route } from '@grafana/external-alertmanager/vanilla';
import { RouteWithID } from '@grafana/external-alertmanager/mimir';

import { MatcherOperator, FormAmRoute } from '../types';
import { amRouteToFormAmRoute, formAmRouteToAmRoute, isValidPromDuration } from './routeTransform';

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
