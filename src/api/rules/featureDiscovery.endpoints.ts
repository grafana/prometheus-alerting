import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { discoverDataSourceFeatures } from './featureDiscovery';
import { DataSourceFeatures } from './featureDiscovery.types';

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
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: errorMessage,
            } as const,
          };
        }
      },
    }),
  }),
});

export const { useDiscoverFeaturesQuery, useLazyDiscoverFeaturesQuery } = featureDiscoveryApi;
