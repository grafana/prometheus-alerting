import { describe, expect, it } from 'vitest';

import { createHttpConfigFormSchema } from './httpConfig.schema';

function messagesFor(input: unknown, options?: { oauth2?: boolean }) {
  const result = createHttpConfigFormSchema(options).safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

function pathsFor(input: unknown, options?: { oauth2?: boolean }) {
  const result = createHttpConfigFormSchema(options).safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
}

const oauth2Block = { client_id: 'id', token_url: 'http://token' };

describe('createHttpConfigFormSchema', () => {
  it('accepts an empty config', () => {
    expect(createHttpConfigFormSchema().safeParse({}).success).toBe(true);
  });

  it('keeps keys it does not know about', () => {
    const result = createHttpConfigFormSchema().parse({ something_new: 'keep me' });
    expect(result).toEqual({ something_new: 'keep me' });
  });

  describe('proxy', () => {
    it('rejects a proxy URL alongside proxy from environment', () => {
      expect(messagesFor({ proxy_url: 'http://proxy', proxy_from_environment: true })).toEqual([
        'Proxy URL and proxy from environment cannot be used together',
      ]);
      expect(pathsFor({ proxy_url: 'http://proxy', proxy_from_environment: true })).toEqual(['proxy_url']);
    });

    it('accepts either one on its own', () => {
      expect(messagesFor({ proxy_url: 'http://proxy' })).toEqual([]);
      expect(messagesFor({ proxy_from_environment: true })).toEqual([]);
    });
  });

  describe('picking one way to authenticate', () => {
    it('rejects authorization together with basic auth', () => {
      expect(messagesFor({ authorization: { credentials: 'token' }, basic_auth: { username: 'user' } })).toEqual([
        'Authorization and basic authentication cannot be used together',
      ]);
      expect(pathsFor({ authorization: { credentials: 'token' }, basic_auth: { username: 'user' } })).toEqual([
        'authorization.credentials',
      ]);
    });

    it('counts the file variants as configured too', () => {
      expect(
        messagesFor({ authorization: { credentials_file: '/token' }, basic_auth: { password_file: '/password' } })
      ).toEqual(['Authorization and basic authentication cannot be used together']);
    });

    it('ignores OAuth2 for integrations that do not offer it', () => {
      expect(messagesFor({ authorization: { credentials: 'token' }, oauth2: oauth2Block })).toEqual([]);
    });

    it('counts OAuth2 and uses the three-way message when the integration offers it', () => {
      expect(messagesFor({ authorization: { credentials: 'token' }, oauth2: oauth2Block }, { oauth2: true })).toEqual([
        'Only one of authorization, basic authentication, or OAuth2 can be used',
      ]);
      expect(messagesFor({ basic_auth: { username: 'user' }, oauth2: oauth2Block }, { oauth2: true })).toEqual([
        'Only one of authorization, basic authentication, or OAuth2 can be used',
      ]);
    });

    it('accepts a single method', () => {
      expect(messagesFor({ authorization: { type: 'Bearer', credentials: 'token' } })).toEqual([]);
      expect(messagesFor({ basic_auth: { username: 'user', password: 'password' } })).toEqual([]);
      expect(messagesFor({ oauth2: oauth2Block }, { oauth2: true })).toEqual([]);
    });
  });

  describe('authorization credentials', () => {
    it('rejects an authorization type with nothing to send', () => {
      expect(messagesFor({ authorization: { type: 'Bearer' } })).toEqual(['Authorization credentials are required']);
    });

    it('accepts a type paired with a credentials file', () => {
      expect(messagesFor({ authorization: { type: 'Bearer', credentials_file: '/token' } })).toEqual([]);
    });

    it('accepts credentials without a type', () => {
      expect(messagesFor({ authorization: { credentials: 'token' } })).toEqual([]);
    });
  });
});

describe('oauth2', () => {
  it('needs a client ID and a token URL, the same two Alertmanager insists on', () => {
    const result = createHttpConfigFormSchema({ oauth2: true }).safeParse({ oauth2: { client_secret: 'secret' } });
    expect(result.success).toBe(false);
  });

  it('accepts a complete block', () => {
    expect(
      createHttpConfigFormSchema({ oauth2: true }).safeParse({
        oauth2: { client_id: 'id', token_url: 'http://token', client_secret: 'secret' },
      }).success
    ).toBe(true);
  });
});

describe('createHttpConfigFormSchema, rules Alertmanager enforces on the HTTP block', () => {
  describe('no proxy', () => {
    it('rejects no proxy on its own', () => {
      expect(messagesFor({ no_proxy: 'localhost' })).toEqual(['No proxy needs a proxy URL as well']);
      expect(pathsFor({ no_proxy: 'localhost' })).toEqual(['no_proxy']);
    });

    it('rejects no proxy alongside proxy from environment', () => {
      expect(messagesFor({ no_proxy: 'localhost', proxy_from_environment: true })).toEqual([
        'No proxy and proxy from environment cannot be used together',
      ]);
    });

    it('accepts no proxy next to a proxy URL', () => {
      expect(messagesFor({ no_proxy: 'localhost', proxy_url: 'http://proxy' })).toEqual([]);
    });
  });

  describe('authorization type', () => {
    it('rejects an authorization type of basic', () => {
      expect(messagesFor({ authorization: { type: 'basic', credentials: 'c' } })).toEqual([
        'Authorization type cannot be "basic". Use basic authentication instead.',
      ]);
      expect(pathsFor({ authorization: { type: 'basic', credentials: 'c' } })).toEqual(['authorization.type']);
    });

    it('rejects it whatever the capitals and spacing', () => {
      expect(messagesFor({ authorization: { type: ' Basic ', credentials: 'c' } })).toEqual([
        'Authorization type cannot be "basic". Use basic authentication instead.',
      ]);
    });

    it('accepts any other type', () => {
      expect(messagesFor({ authorization: { type: 'Bearer', credentials: 'c' } })).toEqual([]);
    });
  });

  describe('TLS versions', () => {
    it('rejects a version Alertmanager does not know', () => {
      expect(messagesFor({ tls_config: { min_version: 'TLS9' } })).toEqual([
        'TLS version must be TLS10, TLS11, TLS12 or TLS13',
      ]);
      expect(pathsFor({ tls_config: { max_version: 'TLS9' } })).toEqual(['tls_config.max_version']);
    });

    it('accepts the four it does know', () => {
      expect(messagesFor({ tls_config: { min_version: 'TLS12', max_version: 'TLS13' } })).toEqual([]);
    });
  });
});
