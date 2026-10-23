import { describe, expect, it } from 'vitest';

import { AlertGroupFactory, GettableAlertFactory } from './mocks/alerts.fakes';
import type { Route } from './api/types/common';
import { getRouteMatches, matchAlertsToRoutes } from './routeMatching';
import { addUniqueIdentifierToRoute as makeTree } from './routes.utils';

describe('matchAlertsToRoutes', () => {
  it.each([
    { name: 'modern', condition: { matchers: [' service = "api" '] } },
    { name: 'legacy equality', condition: { match: { service: 'api' } } },
    { name: 'legacy regex', condition: { match_re: { service: 'api|worker' } } },
  ] satisfies Array<{ name: string; condition: Partial<Route> }>)(
    'matches $name without mutating the tree',
    ({ condition }) => {
      const route = makeTree({ receiver: 'root', routes: [{ receiver: 'selected', ...condition }] });
      const original = structuredClone(route);
      const selected = GettableAlertFactory.build({ labels: { service: 'api' } });
      const rejected = GettableAlertFactory.build({ labels: { service: 'other' } });
      const [selectedRoute] = route.routes!;
      const group = AlertGroupFactory.build({ alerts: [selected, rejected] });

      const matches = matchAlertsToRoutes(route, [group]);

      expect(matches.get(selectedRoute.id)).toEqual([selected]);
      expect(matches.get(route.id)).toEqual([rejected]);
      expect(matches.size).toBe(2);
      expect(route).toEqual(original);
    }
  );

  it('continues to siblings, stops at a non-continued match, and falls back to the root', () => {
    const route = makeTree({
      receiver: 'root',
      routes: [
        { receiver: 'critical', matchers: ['severity="critical"'], continue: true },
        { receiver: 'platform', matchers: ['team="platform"'] },
        { receiver: 'skipped', matchers: ['team="platform"'] },
      ],
    });
    const both = GettableAlertFactory.build({ labels: { severity: 'critical', team: 'platform' } });
    const critical = GettableAlertFactory.build({ labels: { severity: 'critical' } });
    const fallback = GettableAlertFactory.build({ labels: { severity: 'warning' } });
    const [criticalRoute, platformRoute, skippedRoute] = route.routes!;
    const group = AlertGroupFactory.build({ alerts: [both, critical, fallback] });

    const matches = matchAlertsToRoutes(route, [group]);

    expect(matches.get(criticalRoute.id)).toEqual([both, critical]);
    expect(matches.get(platformRoute.id)).toEqual([both]);
    expect(matches.get(route.id)).toEqual([fallback]);
    expect(matches.has(skippedRoute.id)).toBe(false);
    expect(matches.size).toBe(3);
  });

  it.each([false, true])('uses parent continue=%s independently of its leaf continue', (continueParent) => {
    const route = makeTree({
      receiver: 'root',
      routes: [
        {
          receiver: 'parent',
          continue: continueParent,
          matchers: ['team="platform"'],
          routes: [{ receiver: 'leaf', continue: !continueParent, matchers: ['service="api"'] }],
        },
        { receiver: 'sibling', matchers: ['team="platform"'] },
      ],
    });
    const leaf = GettableAlertFactory.build({ labels: { team: 'platform', service: 'api' } });
    const parent = GettableAlertFactory.build({ labels: { team: 'platform', service: 'worker' } });
    const pruned = GettableAlertFactory.build({ labels: { team: 'other', service: 'api' } });
    const [parentRoute, siblingRoute] = route.routes!;
    const [leafRoute] = parentRoute.routes!;
    const group = AlertGroupFactory.build({ alerts: [leaf, parent, pruned] });

    const matches = matchAlertsToRoutes(route, [group]);

    expect(matches.get(leafRoute.id)).toEqual([leaf]);
    expect(matches.get(parentRoute.id)).toEqual([parent]);
    expect(matches.get(route.id)).toEqual([pruned]);
    if (continueParent) {
      expect(matches.get(siblingRoute.id)).toEqual([leaf, parent]);
      expect(matches.size).toBe(4);
    } else {
      expect(matches.has(siblingRoute.id)).toBe(false);
      expect(matches.size).toBe(3);
    }
  });

  it('keeps first fingerprint occurrences, including ones rejected by the root, and preserves alert identity and order', () => {
    const route = makeTree({ receiver: 'root', matchers: ['environment="prod"'] });
    const rejected = GettableAlertFactory.build({ labels: { environment: 'dev' } });
    const first = GettableAlertFactory.build({ labels: { environment: 'prod' } });
    const second = GettableAlertFactory.build({ labels: { environment: 'prod' } });
    const groups = [
      AlertGroupFactory.build({ alerts: [rejected, first, second, first] }),
      AlertGroupFactory.build({
        alerts: [
          GettableAlertFactory.build({ fingerprint: rejected.fingerprint, labels: { environment: 'prod' } }),
          GettableAlertFactory.build({ fingerprint: first.fingerprint, labels: { environment: 'prod' } }),
        ],
      }),
    ];
    const matches = matchAlertsToRoutes(route, groups);
    expect(matches.get(route.id)).toEqual([first, second]);
    expect(matches.size).toBe(1);
    expect(matches.get(route.id)?.[0]).toBe(first);
    expect(matches.get(route.id)?.[1]).toBe(second);
  });

  it.each([
    { matcher: 'service=""', selected: [0, 1] },
    { matcher: 'service!=""', selected: [2, 3] },
    { matcher: 'service=~"api|"', selected: [0, 1, 2] },
    { matcher: 'service!~"api|"', selected: [3] },
  ])('evaluates $matcher for missing, empty, matching, and nonmatching values', ({ matcher, selected }) => {
    const route = makeTree({ receiver: 'root', matchers: [matcher] });
    const alerts = [{}, { service: '' }, { service: 'api' }, { service: 'worker' }].map((labels) =>
      GettableAlertFactory.build({ labels })
    );
    const group = AlertGroupFactory.build({ alerts });
    const expectedAlerts = selected.map((index) => alerts[index]);

    const matches = matchAlertsToRoutes(route, [group]);

    expect(matches.get(route.id)).toEqual(expectedAlerts);
    expect(matches.size).toBe(1);
  });

  it.each([
    { pattern: 'api|worker', values: ['api', 'worker', 'api-worker', 'xapi'], selected: [0, 1] },
    { pattern: '(?i)api', values: ['API', 'api', 'API', 'worker'], selected: [0, 1, 2] },
    { pattern: '(?s)line.*two', values: ['line one\ntwo', 'line three'], selected: [0] },
    { pattern: '(?m)api', values: ['other\napi', 'other'], selected: [0] },
  ])('preserves anchoring, flags, and repeated matches for $pattern', ({ pattern, values, selected }) => {
    const route = makeTree({ receiver: 'root', match_re: { service: pattern } });
    const alerts = values.map((service) => GettableAlertFactory.build({ labels: { service } }));
    const group = AlertGroupFactory.build({ alerts });
    const expectedAlerts = selected.map((index) => alerts[index]);

    const matches = matchAlertsToRoutes(route, [group]);

    expect(matches.get(route.id)).toEqual(expectedAlerts);
    expect(matches.size).toBe(1);
  });

  it('refreshes shared label values for each alert and checks every conjunct', () => {
    const route = makeTree({
      receiver: 'root',
      routes: [
        { receiver: 'api', matchers: ['service=~"api.*"'], continue: true },
        { receiver: 'production-api', matchers: ['service!="worker"', 'service="api"', 'environment="prod"'] },
      ],
    });
    const api = GettableAlertFactory.build({ labels: { service: 'api', environment: 'prod' } });
    const dev = GettableAlertFactory.build({ labels: { service: 'api', environment: 'dev' } });
    const worker = GettableAlertFactory.build({ labels: { service: 'worker', environment: 'prod' } });
    const missing = GettableAlertFactory.build({ labels: {} });
    const [apiRoute, productionApiRoute] = route.routes!;
    const group = AlertGroupFactory.build({ alerts: [api, dev, worker, missing] });

    const matches = matchAlertsToRoutes(route, [group]);

    expect(matches.get(apiRoute.id)).toEqual([api, dev]);
    expect(matches.get(productionApiRoute.id)).toEqual([api]);
    expect(matches.get(route.id)).toEqual([worker, missing]);
    expect(matches.size).toBe(3);
  });

  it.each(['constructor', 'toString', '__proto__'])('distinguishes an own %s label from an absent label', (label) => {
    const route = makeTree({ receiver: 'root', matchers: [`${label}="api"`] });
    const absent = GettableAlertFactory.build({ labels: {} });
    const own = GettableAlertFactory.build({ labels: Object.fromEntries([[label, 'api']]) });
    const group = AlertGroupFactory.build({ alerts: [absent, own] });

    const matches = matchAlertsToRoutes(route, [group]);

    expect(matches.get(route.id)).toEqual([own]);
    expect(matches.size).toBe(1);
  });

  it.each(['=~', '!~'])('treats invalid %s as false for missing labels, but throws for present labels', (operator) => {
    const route = makeTree({
      receiver: 'root',
      routes: [{ receiver: 'invalid', matchers: [`service${operator}"["`] }],
    });
    const absent = GettableAlertFactory.build({ labels: {} });
    const group = AlertGroupFactory.build({ alerts: [absent] });

    const matches = matchAlertsToRoutes(route, [group]);

    expect(matches.get(route.id)).toEqual([absent]);
    expect(matches.size).toBe(1);
    for (const service of ['', 'api']) {
      const alert = GettableAlertFactory.build({ labels: { service } });
      const groupWithPresentLabel = AlertGroupFactory.build({ alerts: [alert] });
      expect(() => matchAlertsToRoutes(route, [groupWithPresentLabel])).toThrow(SyntaxError);
    }
  });

  it('preserves invalid-regex diagnostics after a failed conjunct', () => {
    const route = makeTree({ receiver: 'root', matchers: ['team="platform"', 'service=~"["'] });
    const alert = GettableAlertFactory.build({ labels: { team: 'other', service: 'api' } });
    const group = AlertGroupFactory.build({ alerts: [alert] });

    expect(() => matchAlertsToRoutes(route, [group])).toThrow(SyntaxError);
  });

  it('does not throw for invalid regexes in pruned children or skipped siblings', () => {
    const route = makeTree({
      receiver: 'root',
      routes: [
        {
          receiver: 'pruned',
          matchers: ['team="platform"'],
          routes: [{ receiver: 'invalid-child', matchers: ['service=~"["'] }],
        },
        { receiver: 'selected' },
        { receiver: 'skipped', matchers: ['service=~"["'] },
      ],
    });
    const alert = GettableAlertFactory.build({ labels: { team: 'other', service: 'api' } });
    const [prunedRoute, selectedRoute, skippedRoute] = route.routes!;
    const [invalidChildRoute] = prunedRoute.routes!;
    const group = AlertGroupFactory.build({ alerts: [alert] });

    const matches = matchAlertsToRoutes(route, [group]);

    expect(matches.get(selectedRoute.id)).toEqual([alert]);
    expect(matches.has(prunedRoute.id)).toBe(false);
    expect(matches.has(invalidChildRoute.id)).toBe(false);
    expect(matches.has(skippedRoute.id)).toBe(false);
    expect(matches.size).toBe(1);
  });

  it('parses malformed branches eagerly when groups exist, even if the groups are empty', () => {
    const route = makeTree({
      receiver: 'root',
      routes: [{ receiver: 'selected' }, { receiver: 'invalid', matchers: ['invalid'] }],
    });
    const emptyGroup = AlertGroupFactory.build({ alerts: [] });

    expect(() => matchAlertsToRoutes(route, [emptyGroup])).toThrow('Invalid matcher');
    expect(matchAlertsToRoutes(route, []).size).toBe(0);
  });

  it('returns no matches for a missing tree or empty groups', () => {
    const route = makeTree({ receiver: 'root' });
    const populatedGroup = AlertGroupFactory.build({ alerts: GettableAlertFactory.buildList(1) });
    const emptyGroup = AlertGroupFactory.build({ alerts: [] });

    expect(matchAlertsToRoutes(undefined, [populatedGroup]).size).toBe(0);
    expect(matchAlertsToRoutes(route, []).size).toBe(0);
    expect(matchAlertsToRoutes(route, [emptyGroup]).size).toBe(0);
  });
});

describe('getRouteMatches', () => {
  it('returns stored alerts by reference and defaults absent routes to an empty array', () => {
    const alerts = GettableAlertFactory.buildList(2);
    const matches = new Map([['selected', alerts]]);
    expect(getRouteMatches(matches, 'selected')).toBe(alerts);
    expect(getRouteMatches(matches, 'absent')).toEqual([]);
  });
});
