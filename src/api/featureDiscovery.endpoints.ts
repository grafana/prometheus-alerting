import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { DataSourceFeatures } from '../types/rules';

import { discoverDataSourceFeatures } from './featureDiscovery';

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
              error: error instanceof Error ? error.message : String(error),
              data: error,
            },
          };
        }
      },
    }),
  }),
});

export const { useDiscoverFeaturesQuery, useLazyDiscoverFeaturesQuery } = featureDiscoveryApi;
