import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  GetStatusApiArg,
  AlertmanagerStatusSchema,
  AlertmanagerStatus,
  DeleteSilenceApiArg,
  GetAlertGroupsApiArg,
  GetAlertGroupsApiResponseSchema,
  GetAlertsApiArg,
  GetAlertsApiResponseSchema,
  GetSilenceApiArg,
  GetSilenceApiResponseSchema,
  GetSilencesApiArg,
  GetSilencesApiResponseSchema,
  PostAlertsApiArg,
  PostSilencesApiArg,
  PostSilencesApiResponseSchema,
} from '@grafana/external-alertmanager/vanilla';
import { TransformedAlertmanagerStatusApiResponse, TransformedAlertmanagerStatusApiResponseSchema, TransformedAlertmanagerStatusApiResponseTransform, WithDataSourceUID, hasDataSourceUID, hasImplementation } from './types';

// Dynamic baseQuery that reads dataSourceUID and implementation from query args
const dynamicBaseQuery: ReturnType<typeof fetchBaseQuery> = async (args, api, extraOptions) => {
  // Extract dataSourceUID and implementation from the query args
  const dataSourceUID = hasDataSourceUID(args) ? args.dataSourceUID : undefined;
  const implementation = hasImplementation(args) ? args.implementation : 'prometheus';

  // Determine base URL based on implementation
  const baseUrl = implementation === 'mimir'
    ? `/api/datasources/proxy/uid/${dataSourceUID}/alertmanager/api`
    : `/api/datasources/proxy/uid/${dataSourceUID}/api`;

  // Create and execute base query with the dynamic UID and base URL
  return fetchBaseQuery({
    baseUrl,
  })(args, api, extraOptions);
};

// Base API for Prometheus/vanilla Alertmanager
const baseAlertmanagerApi = createApi({
  reducerPath: 'alertmanagetApi',
  baseQuery: dynamicBaseQuery,
  endpoints: () => ({}),
});

// Inject Prometheus-specific endpoints (getStatus)
export const alertmanagerApi = baseAlertmanagerApi.injectEndpoints({
  endpoints: (build) => ({
    getStatus: build.query<TransformedAlertmanagerStatusApiResponse, WithDataSourceUID<GetStatusApiArg>>({
      query: ({ dataSourceUID, implementation }) => ({
        url: `/v2/status`,
        dataSourceUID,
        implementation
      }),
      transformResponse: (response: AlertmanagerStatus): TransformedAlertmanagerStatusApiResponse => {
        // Use Zod codec to parse YAML and validate the entire transformed response
        return TransformedAlertmanagerStatusApiResponseTransform.parse(response);
      },
      rawResponseSchema: AlertmanagerStatusSchema,
      responseSchema: TransformedAlertmanagerStatusApiResponseSchema,
    }),
    getSilences: build.query({
      query: ({ dataSourceUID, filter, implementation }: WithDataSourceUID<GetSilencesApiArg>) => ({
        url: `/v2/silences`,
        params: {
          filter,
        },
        dataSourceUID,
        implementation
      }),
      responseSchema: GetSilencesApiResponseSchema,
    }),
    postSilences: build.mutation({
      query: ({ dataSourceUID, postableSilence }: WithDataSourceUID<PostSilencesApiArg>) => ({
        url: `/v2/silences`,
        method: 'POST',
        body: postableSilence,
        dataSourceUID,
      }),
      responseSchema: PostSilencesApiResponseSchema,
    }),
    getSilence: build.query({
      query: ({ dataSourceUID, silenceId }: WithDataSourceUID<GetSilenceApiArg>) => ({
        url: `/v2/silence/${silenceId}`,
        dataSourceUID,
      }),
      responseSchema: GetSilenceApiResponseSchema,
    }),
    deleteSilence: build.mutation({
      query: ({ dataSourceUID, silenceId }: WithDataSourceUID<DeleteSilenceApiArg>) => ({
        url: `/v2/silence/${silenceId}`,
        method: 'DELETE',
        dataSourceUID,
      }),
    }),
    getAlerts: build.query({
      query: ({ dataSourceUID, active, silenced, inhibited, unprocessed, filter, receiver }: WithDataSourceUID<GetAlertsApiArg>) => ({
        url: `/v2/alerts`,
        params: {
          active,
          silenced,
          inhibited,
          unprocessed,
          filter,
          receiver,
        },
        dataSourceUID,
      }),
      responseSchema: GetAlertsApiResponseSchema,
    }),
    postAlerts: build.mutation({
      query: ({ dataSourceUID, postableAlerts }: WithDataSourceUID<PostAlertsApiArg>) => ({
        url: `/v2/alerts`,
        method: 'POST',
        body: postableAlerts,
        dataSourceUID,
      }),
    }),
    getAlertGroups: build.query({
      query: ({ dataSourceUID, active, silenced, inhibited, muted, filter, receiver }: WithDataSourceUID<GetAlertGroupsApiArg>) => ({
        url: `/v2/alerts/groups`,
        params: {
          active,
          silenced,
          inhibited,
          muted,
          filter,
          receiver,
        },
        dataSourceUID,
      }),
      responseSchema: GetAlertGroupsApiResponseSchema,
    }),
  })
});
