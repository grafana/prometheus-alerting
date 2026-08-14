import { http, HttpResponse } from 'msw';
import { lastValueFrom } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { isForbiddenError, isNotFoundError } from '../../utils/errors';
import { server } from '../server';

import { createMockBackendSrv } from './backend-srv';

const url = '/api/test/echo';

/** Registers a handler that reports back what it received. */
function echo(method: 'get' | 'post' | 'put' | 'patch' | 'delete' = 'get') {
  const received = vi.fn();

  server.use(
    http[method](url, async ({ request }) => {
      received({
        search: new URL(request.url).search,
        contentType: request.headers.get('Content-Type'),
        custom: request.headers.get('X-Custom'),
        body: await request.text(),
      });
      return HttpResponse.json({ ok: true });
    })
  );

  return received;
}

describe('createMockBackendSrv', () => {
  describe('query params', () => {
    it('repeats the key for an array instead of joining the values', async () => {
      const received = echo();

      await createMockBackendSrv().get(url, { match: ['a', 'b'] });

      expect(received).toHaveBeenCalledWith(expect.objectContaining({ search: '?match=a&match=b' }));
    });

    it('leaves out undefined params but keeps null ones', async () => {
      const received = echo();

      await createMockBackendSrv().get(url, { gone: undefined, empty: null, kept: 'yes' });

      expect(received).toHaveBeenCalledWith(expect.objectContaining({ search: '?empty=null&kept=yes' }));
    });

    it('leaves the url alone when there are no params', async () => {
      const received = echo();

      await createMockBackendSrv().get(url);

      expect(received).toHaveBeenCalledWith(expect.objectContaining({ search: '' }));
    });
  });

  describe('method signatures', () => {
    it("sends delete's second argument as a body, not as query params", async () => {
      const received = echo('delete');

      await createMockBackendSrv().delete(url, { rule: 'my-rule' });

      expect(received).toHaveBeenCalledWith(expect.objectContaining({ search: '', body: '{"rule":"my-rule"}' }));
    });

    it('forwards the options passed as get()s fourth argument', async () => {
      const received = echo();

      await createMockBackendSrv().get(url, undefined, 'request-id', { headers: { 'X-Custom': 'from-options' } });

      expect(received).toHaveBeenCalledWith(expect.objectContaining({ custom: 'from-options' }));
    });
  });

  describe('request bodies', () => {
    it('encodes an object as JSON and labels it', async () => {
      const received = echo('post');

      await createMockBackendSrv().post(url, { name: 'group' });

      expect(received).toHaveBeenCalledWith(
        expect.objectContaining({ body: '{"name":"group"}', contentType: 'application/json' })
      );
    });

    it('keeps the content type the caller set', async () => {
      const received = echo('post');

      await createMockBackendSrv().post(url, 'name: group\n', { headers: { 'Content-Type': 'application/yaml' } });

      expect(received).toHaveBeenCalledWith(
        expect.objectContaining({ body: 'name: group\n', contentType: 'application/yaml' })
      );
    });

    it('sends URLSearchParams as form data rather than JSON', async () => {
      const received = echo('post');

      await createMockBackendSrv().post(url, new URLSearchParams({ query: 'up' }));

      expect(received).toHaveBeenCalledWith(expect.objectContaining({ body: 'query=up' }));
      expect(received.mock.calls[0][0].contentType).toContain('application/x-www-form-urlencoded');
    });
  });

  describe('response parsing', () => {
    it('parses JSON by default', async () => {
      server.use(http.get(url, () => HttpResponse.json({ hello: 'world' })));

      await expect(createMockBackendSrv().get(url)).resolves.toEqual({ hello: 'world' });
    });

    it('returns text unparsed when asked for text', async () => {
      server.use(http.get(url, () => HttpResponse.text('{"not":"parsed"}')));

      await expect(createMockBackendSrv().get(url, undefined, undefined, { responseType: 'text' })).resolves.toBe(
        '{"not":"parsed"}'
      );
    });

    it('returns an ArrayBuffer when asked for one', async () => {
      server.use(http.get(url, () => HttpResponse.text('bytes')));

      const data = await createMockBackendSrv().get<ArrayBuffer>(url, undefined, undefined, {
        responseType: 'arraybuffer',
      });

      expect(data).toBeInstanceOf(ArrayBuffer);
      expect(new TextDecoder().decode(data)).toBe('bytes');
    });

    it('returns a Blob when asked for one', async () => {
      server.use(http.get(url, () => HttpResponse.text('bytes')));

      const data = await createMockBackendSrv().get<Blob>(url, undefined, undefined, { responseType: 'blob' });

      expect(await data.text()).toBe('bytes');
    });

    it('falls back to text for a body that is not valid JSON', async () => {
      server.use(http.get(url, () => HttpResponse.text('not json')));

      await expect(createMockBackendSrv().get(url)).resolves.toBe('not json');
    });

    it('gives back null for an empty body', async () => {
      server.use(http.get(url, () => new HttpResponse(null, { status: 200 })));

      await expect(createMockBackendSrv().get(url)).resolves.toBeNull();
    });
  });

  describe('the response envelope', () => {
    it('carries the full set of fields', async () => {
      server.use(http.get(url, () => HttpResponse.json({ hello: 'world' })));

      const response = await lastValueFrom(createMockBackendSrv().fetch({ url, params: { a: '1' } }));

      expect(response).toMatchObject({
        data: { hello: 'world' },
        status: 200,
        ok: true,
        redirected: false,
        config: { url, params: { a: '1' } },
      });
      expect(response.headers).toBeInstanceOf(Headers);
      expect(typeof response.url).toBe('string');
      expect(typeof response.type).toBe('string');
    });
  });

  describe('failures', () => {
    it('rejects with something isNotFoundError recognises', async () => {
      server.use(http.get(url, () => HttpResponse.json({ message: 'group does not exist' }, { status: 404 })));

      const error = await createMockBackendSrv()
        .get(url)
        .catch((e) => e);

      expect(isNotFoundError(error)).toBe(true);
      expect(error).toMatchObject({ status: 404, data: { message: 'group does not exist' } });
      expect(error.message).toBe('group does not exist');
    });

    it('rejects with something isForbiddenError recognises', async () => {
      server.use(http.get(url, () => HttpResponse.json({ message: 'nope' }, { status: 403 })));

      const error = await createMockBackendSrv()
        .get(url)
        .catch((e) => e);

      expect(isForbiddenError(error)).toBe(true);
    });

    it('rejects through fetch() as well', async () => {
      server.use(http.get(url, () => HttpResponse.json({ message: 'nope' }, { status: 404 })));

      await expect(lastValueFrom(createMockBackendSrv().fetch({ url }))).rejects.toMatchObject({ status: 404 });
    });

    // A request that never reached a server is not an HTTP error, so it stays whatever `fetch`
    // threw rather than being reshaped into one.
    it('lets a network failure through as-is', async () => {
      server.use(http.get(url, () => HttpResponse.error()));

      const error = await createMockBackendSrv()
        .get(url)
        .catch((e) => e);

      expect(error).toBeInstanceOf(Error);
      expect(error).not.toHaveProperty('status');
    });

    it('rejects when the request is aborted', async () => {
      server.use(http.get(url, () => HttpResponse.json({})));
      const controller = new AbortController();
      controller.abort();

      const error = await lastValueFrom(createMockBackendSrv().fetch({ url, abortSignal: controller.signal })).catch(
        (e) => e
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AbortError');
    });
  });

  // Deprecated, but still part of the interface a plugin can call.
  describe('request()', () => {
    it('resolves the response body', async () => {
      server.use(http.post(url, () => HttpResponse.json({ hello: 'world' })));

      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const data = await createMockBackendSrv().request({ url, method: 'POST', data: { name: 'group' } });

      expect(data).toEqual({ hello: 'world' });
    });
  });
});
