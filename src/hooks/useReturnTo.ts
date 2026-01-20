import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { textUtil } from '@grafana/data';
import { config, locationService } from '@grafana/runtime';

/**
 * This hook provides a safe way to obtain the `returnTo` URL from the query string parameter
 * It validates the origin and protocol to ensure the URL is within the Grafana app
 */
/* eslint-disable no-redeclare -- TypeScript function overloads require multiple declarations */
export function useReturnTo(): { returnTo: string | undefined };
export function useReturnTo(fallback: string): { returnTo: string };
export function useReturnTo(fallback?: string): { returnTo: string | undefined } {
  /* eslint-enable no-redeclare */
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const emptyResult = { returnTo: fallback };
    const returnTo = searchParams.get('returnTo');

    if (!returnTo) {
      return emptyResult;
    }

    const sanitizedReturnTo = textUtil.sanitizeUrl(returnTo);
    const baseUrl = `${window.location.origin}/${config.appSubUrl}`;

    const sanitizedUrl = tryParseURL(sanitizedReturnTo, baseUrl);

    if (!sanitizedUrl) {
      console.warn('Malformed returnTo parameter', { returnTo });
      return emptyResult;
    }

    const { protocol, origin, pathname, search } = sanitizedUrl;
    if (!['http:', 'https:'].includes(protocol) || origin !== window.location.origin) {
      console.warn('Malformed returnTo parameter', { returnTo });
      return emptyResult;
    }

    return { returnTo: `${pathname}${search}` };
  }, [searchParams, fallback]);
}

/**
 * Create a "returnTo" URL from the current location
 */
export function createReturnTo(includeSearch = true): string {
  const { pathname, search } = locationService.getLocation();
  return pathname + (includeSearch ? search : '');
}

/**
 * Tries to mimic URL.parse method
 * https://developer.mozilla.org/en-US/docs/Web/API/URL/parse_static
 */
function tryParseURL(sanitizedReturnTo: string, baseUrl: string): URL | null {
  try {
    return new URL(sanitizedReturnTo, baseUrl);
  } catch {
    return null;
  }
}
