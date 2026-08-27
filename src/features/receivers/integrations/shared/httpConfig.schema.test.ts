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
