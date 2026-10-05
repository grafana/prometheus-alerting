import { describe, it, expect } from '@rstest/core';
import type { Route } from '@grafana/external-alertmanager/vanilla';
import { findTimeIntervalUses, removeTimeIntervalFromRoute, renameTimeInterval } from './muteTimings.utils';

const baseRoute: Route = {
  receiver: 'default',
  mute_time_intervals: ['business-hours', 'weekends'],
  active_time_intervals: ['on-call'],
  routes: [
    {
      receiver: 'team-a',
      mute_time_intervals: ['weekends'],
      routes: [
        {
          receiver: 'team-a-sub',
          mute_time_intervals: ['business-hours'],
          active_time_intervals: ['weekends'],
        },
      ],
    },
  ],
};

describe('removeTimeIntervalFromRoute', () => {
  it('removes the interval from mute_time_intervals', () => {
    const result = removeTimeIntervalFromRoute('weekends', baseRoute);
    expect(result.mute_time_intervals).toEqual(['business-hours']);
  });

  it('removes the interval from active_time_intervals', () => {
    const result = removeTimeIntervalFromRoute('on-call', baseRoute);
    expect(result.active_time_intervals).toEqual([]);
  });

  it('removes the interval recursively from child routes', () => {
    const result = removeTimeIntervalFromRoute('business-hours', baseRoute);
    expect(result.mute_time_intervals).toEqual(['weekends']);
    expect(result.routes![0].routes![0].mute_time_intervals).toEqual([]);
  });

  it('does not mutate the original route', () => {
    removeTimeIntervalFromRoute('weekends', baseRoute);
    expect(baseRoute.mute_time_intervals).toContain('weekends');
  });

  it('handles route without the interval gracefully', () => {
    const result = removeTimeIntervalFromRoute('nonexistent', baseRoute);
    expect(result.mute_time_intervals).toEqual(['business-hours', 'weekends']);
  });
});

describe('renameTimeInterval', () => {
  it('renames in mute_time_intervals', () => {
    const result = renameTimeInterval('holidays', 'weekends', baseRoute);
    expect(result.mute_time_intervals).toContain('holidays');
    expect(result.mute_time_intervals).not.toContain('weekends');
  });

  it('renames in active_time_intervals', () => {
    const result = renameTimeInterval('oncall-v2', 'on-call', baseRoute);
    expect(result.active_time_intervals).toContain('oncall-v2');
  });

  it('renames recursively in child routes', () => {
    const result = renameTimeInterval('holidays', 'weekends', baseRoute);
    expect(result.routes![0].mute_time_intervals).toContain('holidays');
    expect(result.routes![0].routes![0].active_time_intervals).toContain('holidays');
  });

  it('does not mutate the original route', () => {
    renameTimeInterval('holidays', 'weekends', baseRoute);
    expect(baseRoute.mute_time_intervals).toContain('weekends');
  });

  it('leaves unrelated intervals unchanged', () => {
    const result = renameTimeInterval('holidays', 'weekends', baseRoute);
    expect(result.mute_time_intervals).toContain('business-hours');
  });
});

describe('findTimeIntervalUses', () => {
  const tree: Route = {
    receiver: 'root-receiver',
    mute_time_intervals: ['weekends'],
    routes: [
      { receiver: 'pager', active_time_intervals: ['on-call'] },
      {
        receiver: 'email',
        mute_time_intervals: ['weekends'],
        routes: [{ mute_time_intervals: ['weekends'], active_time_intervals: ['weekends'] }],
      },
    ],
  };

  it('finds nothing for an interval no route mentions', () => {
    expect(findTimeIntervalUses('holidays', tree)).toEqual([]);
  });

  it('reports the root route and every child that uses the interval', () => {
    expect(findTimeIntervalUses('weekends', tree)).toEqual([
      { receiver: 'root-receiver', usedAs: 'mute' },
      { receiver: 'email', usedAs: 'mute' },
      // The deepest route mutes and restricts on the same interval, so it is reported twice
      { receiver: undefined, usedAs: 'mute' },
      { receiver: undefined, usedAs: 'active' },
    ]);
  });

  it('tells a mute timing apart from an active timing', () => {
    expect(findTimeIntervalUses('on-call', tree)).toEqual([{ receiver: 'pager', usedAs: 'active' }]);
  });

  it('handles a route with no children and no timings', () => {
    expect(findTimeIntervalUses('weekends', { receiver: 'plain' })).toEqual([]);
  });
});
