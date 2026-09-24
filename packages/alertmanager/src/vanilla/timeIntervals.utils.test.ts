import { describe, it, expect } from 'vitest';
import { type RouteWithID } from './routes.utils';
import { findTimeIntervalUses } from './timeIntervals.utils';

describe('findTimeIntervalUses', () => {
  const tree: RouteWithID = {
    id: 'root',
    receiver: 'root-receiver',
    mute_time_intervals: ['weekends'],
    routes: [
      { id: 'pager', receiver: 'pager', active_time_intervals: ['on-call'] },
      {
        id: 'email',
        receiver: 'email',
        mute_time_intervals: ['weekends'],
        matchers: ['team=ops'],
        routes: [{ id: 'inherits', mute_time_intervals: ['weekends'], active_time_intervals: ['weekends'] }],
      },
    ],
  };

  it('finds nothing for an interval no route mentions', () => {
    expect(findTimeIntervalUses('holidays', tree)).toEqual([]);
  });

  it('reports the root route and every child that uses the interval', () => {
    expect(findTimeIntervalUses('weekends', tree)).toEqual([
      { routeId: 'root', receiver: 'root-receiver', matchers: undefined, usedAs: ['mute'] },
      { routeId: 'email', receiver: 'email', matchers: ['team=ops'], usedAs: ['mute'] },
      // The deepest route mutes and restricts on the same interval, so it is listed once with both
      { routeId: 'inherits', receiver: undefined, matchers: undefined, usedAs: ['mute', 'active'] },
    ]);
  });

  it('tells a mute timing apart from an active timing', () => {
    expect(findTimeIntervalUses('on-call', tree)).toEqual([
      { routeId: 'pager', receiver: 'pager', matchers: undefined, usedAs: ['active'] },
    ]);
  });

  it('handles a route with no children and no timings', () => {
    expect(findTimeIntervalUses('weekends', { id: 'plain', receiver: 'plain' })).toEqual([]);
  });
});
