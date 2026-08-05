import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { isFetchError } from '@grafana/runtime';

import { extractErrorMessage } from '../../utils/errors';

import { DataSourceFeatures, discoverDataSourceFeatures } from './featureDiscovery';

export const featureDiscoveryApi = createApi({
  reducerPath: 'featureDiscoveryApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  endpoints: (build) => ({
    discoverFeatures: build.query<DataSourceFeatures, { uid: string }>({
      queryFn: async ({ uid }) => {
        try {
          const features = await discoverDataSourceFeatures(uid);
          return { data: features };
        } catch (error) {
          return { error: toFeatureDiscoveryError(error) };
        }
      },
    }),
  }),
});

export const { useDiscoverFeaturesQuery, useLazyDiscoverFeaturesQuery } = featureDiscoveryApi;

/**
 * Request context we keep alongside the RTK Query error – `FetchError` carries it, but only
 * `status` and `data` survive the conversion, and a bare "Bad Gateway" is not much to go on.
 */
interface RulesRequestContext {
  statusText?: string;
  url?: string;
}

export function toFeatureDiscoveryError(error: unknown): FetchBaseQueryError & RulesRequestContext {
  if (isFetchError(error)) {
    return {
      status: error.status,
      data: error.data,
      statusText: error.statusText,
      url: error.config?.url,
    };
  }

  return {
    status: 'CUSTOM_ERROR',
    error: extractErrorMessage(error),
  };
}
