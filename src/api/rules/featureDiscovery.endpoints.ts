import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

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
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: extractErrorMessage(error),
            } as const,
          };
        }
      },
    }),
  }),
});

export const { useDiscoverFeaturesQuery, useLazyDiscoverFeaturesQuery } = featureDiscoveryApi;
