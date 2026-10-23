import type { Matcher } from '@grafana/external-alertmanager/vanilla';

import { AlertStatusFactory, GettableAlertFactory } from '../../alerts/mocks/alerts.fakes';
import { GettableSilenceFactory } from '../mocks/silences.fakes';
import { alertMatchesSilence, matchesSilenceMatcher, toLabelMatcher } from './matchesSilenceMatcher';

describe('matchesSilenceMatcher', () => {
  const silenceMatcher: Matcher = { name: 'foo', value: 'bar', isRegex: false, isEqual: true };

  describe('equals filter (=)', () => {
    it('matches when name and value are equal', () => {
      const filter: Matcher = { name: 'foo', value: 'bar', isRegex: false, isEqual: true };
      expect(matchesSilenceMatcher(filter, silenceMatcher)).toBe(true);
    });

    it('does not match when value differs', () => {
      const filter: Matcher = { name: 'foo', value: 'baz', isRegex: false, isEqual: true };
      expect(matchesSilenceMatcher(filter, silenceMatcher)).toBe(false);
    });

    it('does not match when name differs', () => {
      const filter: Matcher = { name: 'other', value: 'bar', isRegex: false, isEqual: true };
      expect(matchesSilenceMatcher(filter, silenceMatcher)).toBe(false);
    });

    it('matches regardless of silence matcher operator type', () => {
      const notEqualSilenceMatcher: Matcher = { name: 'foo', value: 'bar', isRegex: false, isEqual: false };
      const filter: Matcher = { name: 'foo', value: 'bar', isRegex: false, isEqual: true };
      expect(matchesSilenceMatcher(filter, notEqualSilenceMatcher)).toBe(true);
    });
  });

  describe('not-equal filter (!=)', () => {
    it('matches when value does not equal filter value', () => {
      const filter: Matcher = { name: 'foo', value: 'baz', isRegex: false, isEqual: false };
      expect(matchesSilenceMatcher(filter, silenceMatcher)).toBe(true);
    });

    it('does not match when value equals filter value', () => {
      const filter: Matcher = { name: 'foo', value: 'bar', isRegex: false, isEqual: false };
      expect(matchesSilenceMatcher(filter, silenceMatcher)).toBe(false);
    });

    it('matches regardless of silence matcher operator type', () => {
      const regexSilenceMatcher: Matcher = { name: 'foo', value: 'bar', isRegex: true, isEqual: true };
      const filter: Matcher = { name: 'foo', value: 'baz', isRegex: false, isEqual: false };
      expect(matchesSilenceMatcher(filter, regexSilenceMatcher)).toBe(true);
    });
  });

  describe('regex filter (=~)', () => {
    it('matches when regex matches the value', () => {
      const filter: Matcher = { name: 'foo', value: 'b.*', isRegex: true, isEqual: true };
      expect(matchesSilenceMatcher(filter, silenceMatcher)).toBe(true);
    });

    it('does not match when regex does not match the value', () => {
      const filter: Matcher = { name: 'foo', value: '^z', isRegex: true, isEqual: true };
      expect(matchesSilenceMatcher(filter, silenceMatcher)).toBe(false);
    });

    it('matches regardless of silence matcher operator type', () => {
      const regexSilenceMatcher: Matcher = { name: 'foo', value: 'bar', isRegex: true, isEqual: true };
      const filter: Matcher = { name: 'foo', value: 'b.*', isRegex: true, isEqual: true };
      expect(matchesSilenceMatcher(filter, regexSilenceMatcher)).toBe(true);
    });

    it('matches against not-equal silence matcher', () => {
      const notEqualSilenceMatcher: Matcher = { name: 'foo', value: 'bar', isRegex: false, isEqual: false };
      const filter: Matcher = { name: 'foo', value: 'b.*', isRegex: true, isEqual: true };
      expect(matchesSilenceMatcher(filter, notEqualSilenceMatcher)).toBe(true);
    });

    it('does not partial-match (regex is anchored like Prometheus)', () => {
      const filter: Matcher = { name: 'foo', value: 'ba', isRegex: true, isEqual: true };
      const matcher: Matcher = { name: 'foo', value: 'bar', isRegex: false, isEqual: true };
      expect(matchesSilenceMatcher(filter, matcher)).toBe(false);
    });
  });

  describe('negative regex filter (!~)', () => {
    it('does not match when regex matches the value', () => {
      const filter: Matcher = { name: 'foo', value: 'b.*', isRegex: true, isEqual: false };
      expect(matchesSilenceMatcher(filter, silenceMatcher)).toBe(false);
    });

    it('matches when regex does not match the value', () => {
      const filter: Matcher = { name: 'foo', value: '^z', isRegex: true, isEqual: false };
      expect(matchesSilenceMatcher(filter, silenceMatcher)).toBe(true);
    });
  });

  describe('invalid regex', () => {
    it('returns false for invalid regex pattern', () => {
      const filter: Matcher = { name: 'foo', value: '[invalid', isRegex: true, isEqual: true };
      expect(matchesSilenceMatcher(filter, silenceMatcher)).toBe(false);
    });
  });
});

describe('toLabelMatcher', () => {
  it('treats a missing isEqual as equal, like Alertmanager does', () => {
    expect(toLabelMatcher({ name: 'foo', value: 'bar', isRegex: false })).toEqual({
      label: 'foo',
      type: '=',
      value: 'bar',
    });
    expect(toLabelMatcher({ name: 'foo', value: 'b.*', isRegex: true })).toEqual({
      label: 'foo',
      type: '=~',
      value: 'b.*',
    });
  });
});

describe('alertMatchesSilence', () => {
  it('matches when the Alertmanager already lists the silence on the alert', () => {
    const silence = GettableSilenceFactory.build({ matchers: [{ name: 'foo', value: 'other', isRegex: false }] });
    const alert = GettableAlertFactory.build({
      labels: { foo: 'bar' },
      status: AlertStatusFactory.build({ silencedBy: [silence.id] }),
    });

    expect(alertMatchesSilence(alert, silence)).toBe(true);
  });

  it('requires every matcher to match, with anchored regexes', () => {
    const silence = GettableSilenceFactory.build({
      matchers: [
        { name: 'team', value: 'platform', isRegex: false, isEqual: true },
        { name: 'service', value: 'api|worker', isRegex: true, isEqual: true },
      ],
    });

    expect(
      alertMatchesSilence(GettableAlertFactory.build({ labels: { team: 'platform', service: 'api' } }), silence)
    ).toBe(true);
    expect(
      alertMatchesSilence(GettableAlertFactory.build({ labels: { team: 'platform', service: 'api-2' } }), silence)
    ).toBe(false);
    expect(
      alertMatchesSilence(GettableAlertFactory.build({ labels: { team: 'other', service: 'api' } }), silence)
    ).toBe(false);
  });

  it('reads a missing label as an empty value, like Alertmanager does', () => {
    const alert = GettableAlertFactory.build({ labels: {} });
    const notEqual = GettableSilenceFactory.build({
      matchers: [{ name: 'foo', value: 'bar', isRegex: false, isEqual: false }],
    });
    const equal = GettableSilenceFactory.build({
      matchers: [{ name: 'foo', value: 'bar', isRegex: false, isEqual: true }],
    });

    expect(alertMatchesSilence(alert, notEqual)).toBe(true);
    expect(alertMatchesSilence(alert, equal)).toBe(false);
  });
});
