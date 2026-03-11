import {
  transformEntry,
  shouldDisplayConfigEntry,
  filterAndTransformConfigEntries,
  getContactPointDescription,
  getReceiverIntegrations,
} from './receiversUtils';
import type { Receiver } from '@grafana/external-alertmanager/vanilla';

describe('transformEntry', () => {
  it('passes through normal values unchanged', () => {
    expect(transformEntry(['url', 'http://example.com'])).toEqual({ label: 'url', value: 'http://example.com' });
  });

  it('masks <secret> values', () => {
    expect(transformEntry(['password', '<secret>'])).toEqual({ label: 'password', value: '*************' });
  });

  it('masks nested <secret> values in objects', () => {
    const result = transformEntry(['config', { token: '<secret>', url: 'http://x.com' }]);
    expect((result.value as Record<string, unknown>).token).toBe('*************');
    expect((result.value as Record<string, unknown>).url).toBe('http://x.com');
  });

  it('masks <secret> values inside arrays', () => {
    const result = transformEntry(['tokens', ['<secret>', 'plain']]);
    expect(result.value).toEqual(['*************', 'plain']);
  });
});

describe('shouldDisplayConfigEntry', () => {
  it('returns false for internal fields starting with _', () => {
    expect(shouldDisplayConfigEntry('_internal', 'value')).toBe(false);
  });

  it('returns false for null values', () => {
    expect(shouldDisplayConfigEntry('key', null)).toBe(false);
  });

  it('returns false for undefined values', () => {
    // The function explicitly handles undefined even though JsonValue excludes it at the type level
    expect(shouldDisplayConfigEntry('key', undefined as unknown as null)).toBe(false);
  });

  it('returns false for excluded keys', () => {
    expect(shouldDisplayConfigEntry('password', 'x', { excludeKeys: ['password'] })).toBe(false);
  });

  it('returns false for empty objects when excludeEmptyObjects is true', () => {
    expect(shouldDisplayConfigEntry('cfg', {}, { excludeEmptyObjects: true })).toBe(false);
  });

  it('returns true for non-empty objects when excludeEmptyObjects is true', () => {
    expect(shouldDisplayConfigEntry('cfg', { a: 1 }, { excludeEmptyObjects: true })).toBe(true);
  });

  it('returns true for normal key/value pairs', () => {
    expect(shouldDisplayConfigEntry('url', 'http://x.com')).toBe(true);
  });
});

describe('filterAndTransformConfigEntries', () => {
  it('filters out internal and null fields, transforms secrets', () => {
    const config = {
      _skip: 'yes',
      url: 'http://x.com',
      token: '<secret>',
      empty: null,
    };
    const result = filterAndTransformConfigEntries(config);
    expect(result.map((e) => e.label)).toEqual(expect.arrayContaining(['url', 'token']));
    expect(result.find((e) => e.label === '_skip')).toBeUndefined();
    expect(result.find((e) => e.label === 'empty')).toBeUndefined();
    expect(result.find((e) => e.label === 'token')?.value).toBe('*************');
  });
});

describe('getContactPointDescription', () => {
  it('returns placeholder for receiver with no integrations', () => {
    const receiver: Receiver = { name: 'empty' };
    expect(getContactPointDescription(receiver)).toBe('<empty contact point>');
  });

  it('returns single integration type without count', () => {
    const receiver: Receiver = { name: 'test', email_configs: [{ to: 'a@b.com' }] };
    expect(getContactPointDescription(receiver)).toBe('email');
  });

  it('shows count for multiple configs of the same type', () => {
    const receiver: Receiver = {
      name: 'test',
      email_configs: [{ to: 'a@b.com' }, { to: 'c@d.com' }],
    };
    expect(getContactPointDescription(receiver)).toBe('email (2)');
  });

  it('lists multiple integration types separated by comma', () => {
    const receiver: Receiver = {
      name: 'multi',
      email_configs: [{ to: 'a@b.com' }],
      slack_configs: [{ channel: '#alerts' }],
    };
    const desc = getContactPointDescription(receiver);
    expect(desc).toContain('email');
    expect(desc).toContain('slack');
  });
});

describe('getReceiverIntegrations', () => {
  it('returns empty array for receiver with no integrations', () => {
    const receiver: Receiver = { name: 'empty' };
    expect(getReceiverIntegrations(receiver)).toEqual([]);
  });

  it('returns integration counts', () => {
    const receiver: Receiver = {
      name: 'test',
      webhook_configs: [{ url: 'http://a.com' }, { url: 'http://b.com' }],
    };
    const result = getReceiverIntegrations(receiver);
    expect(result).toContainEqual({ type: 'webhook', count: 2 });
  });
});
