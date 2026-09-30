import { getBackendSrv } from '@grafana/runtime';
import type { RulerRequest, RulerTransport } from '@grafana/external-rules/ruler';
import { lastValueFrom } from 'rxjs';

import { buildDatasourceProxyUrl } from '../../utils/proxyPath';

/**
 * Builds the only network capability a rules-source flavor is given: requests against a single
 * data source's proxy root.
 *
 * Flavors deliberately do not get `getBackendSrv()`. Binding the UID here means flavor code
 * cannot address another data source or any other Grafana API, and cannot splice a `../`
 * segment out of the proxy prefix -- see the security contract on
 * {@link buildDatasourceProxyUrl}.
 */
export function createRulerTransport(dataSourceUid: string): RulerTransport {
  return async <T>({ method = 'GET', segments, params, headers, body, responseType = 'json' }: RulerRequest) => {
    const invalidSegment = segments.find((segment) => segment.includes('/'));
    if (invalidSegment !== undefined) {
      throw new Error(`Path segment must not contain "/": ${invalidSegment}`);
    }

    const response = await lastValueFrom(
      getBackendSrv().fetch<T>({
        url: buildDatasourceProxyUrl(dataSourceUid, ...segments),
        method,
        params,
        headers,
        data: body,
        responseType: responseType === 'text' ? 'text' : 'json',
        showErrorAlert: false,
        showSuccessAlert: false,
      })
    );

    if (!response.ok) {
      throw response;
    }

    return response.data;
  };
}
