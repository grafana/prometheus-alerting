import { routes, silences, timeIntervals } from './navigation';

describe('silences.createForAlertInstanceLink', () => {
  function matchersFrom(url: string) {
    const params = new URLSearchParams(url.split('?')[1]);
    return JSON.parse(params.get('matchers') ?? '[]');
  }

  it('turns every label on the instance into an equality matcher', () => {
    const url = silences.createForAlertInstanceLink({
      alertname: 'HighMemoryUsage',
      instance: 'server-1',
      severity: 'critical',
    });

    expect(matchersFrom(url)).toEqual([
      { name: 'alertname', value: 'HighMemoryUsage', isRegex: false, isEqual: true },
      { name: 'instance', value: 'server-1', isRegex: false, isEqual: true },
      { name: 'severity', value: 'critical', isRegex: false, isEqual: true },
    ]);
  });

  it('leaves out private labels, which are no use as matchers', () => {
    const url = silences.createForAlertInstanceLink({
      alertname: 'HighMemoryUsage',
      __alert_rule_uid__: 'abc123',
    });

    expect(matchersFrom(url)).toEqual([{ name: 'alertname', value: 'HighMemoryUsage', isRegex: false, isEqual: true }]);
  });

  it('falls back to an empty create form when there is nothing to match on', () => {
    const url = silences.createForAlertInstanceLink({ __private__: 'x' });

    expect(url).not.toContain('matchers=');
  });
});

describe('silences.listPageLink', () => {
  it('links to the plain list without IDs', () => {
    expect(silences.listPageLink()).toContain('/silences');
    expect(silences.listPageLink()).not.toContain('silenceIds');
    expect(silences.listPageLink([])).not.toContain('silenceIds');
  });

  it('narrows the list to the given silence IDs', () => {
    const url = silences.listPageLink(['silence-1', 'silence-2']);
    const params = new URLSearchParams(url.split('?')[1]);

    expect(params.get('silenceIds')).toBe('silence-1,silence-2');
  });
});

describe('routes.listPageLink', () => {
  it('links to the routes page of an Alertmanager', () => {
    const [path, query] = routes.listPageLink('am-uid').split('?');
    const params = new URLSearchParams(query);

    expect(path).toMatch(/\/routes$/);
    expect(params.get('alertmanager')).toBe('am-uid');
    expect(params.has('routeId')).toBe(false);
  });

  it('points the routes page at one route', () => {
    const params = new URLSearchParams(routes.listPageLink('am-uid', '0-1-abc123').split('?')[1]);

    expect(params.get('alertmanager')).toBe('am-uid');
    expect(params.get('routeId')).toBe('0-1-abc123');
  });
});

describe('timeIntervals.listPageLink', () => {
  it('links to the time intervals page of an Alertmanager', () => {
    const [path, query] = timeIntervals.listPageLink('am-uid').split('?');
    const params = new URLSearchParams(query);

    expect(path).toMatch(/\/time-intervals$/);
    expect(params.get('alertmanager')).toBe('am-uid');
    expect(params.has('name')).toBe(false);
  });

  it('points the time intervals page at one interval, escaping the name', () => {
    const params = new URLSearchParams(timeIntervals.listPageLink('am-uid', 'business hours & weekends').split('?')[1]);

    expect(params.get('alertmanager')).toBe('am-uid');
    expect(params.get('name')).toBe('business hours & weekends');
  });
});
