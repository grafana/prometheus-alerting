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
import {
  TransformedAlertmanagerStatusApiResponse,
  TransformedAlertmanagerStatusApiResponseSchema,
  TransformedAlertmanagerStatusApiResponseTransform,
  WithDataSourceInformation,
  hasDataSourceUID,
  hasImplementation,
} from './alertmanager.types';

// Dynamic baseQuery that reads dataSourceUID and implementation from query args
const dynamicBaseQuery: ReturnType<typeof fetchBaseQuery> = async (args, api, extraOptions) => {
  // Extract dataSourceUID and implementation from the query args
  const dataSourceUID = hasDataSourceUID(args) ? args.dataSourceUID : undefined;
  const implementation = hasImplementation(args) ? args.implementation : 'prometheus';

  // Determine base URL based on implementation
  const baseUrl =
    implementation === 'mimir'
      ? `/api/datasources/proxy/uid/${dataSourceUID}/alertmanager/api`
      : `/api/datasources/proxy/uid/${dataSourceUID}/api`;

  // Create and execute base query with the dynamic UID and base URL
  return fetchBaseQuery({
    baseUrl,
  })(args, api, extraOptions);
};

// Base API for Prometheus/vanilla Alertmanager
const baseAlertmanagerApi = createApi({
  reducerPath: 'alertmanagerApi',
  baseQuery: dynamicBaseQuery,
  tagTypes: ['Silences', 'Alerts', 'AlertGroups'],
  endpoints: () => ({}),
});

// Inject Prometheus-specific endpoints (getStatus)
export const alertmanagerApi = baseAlertmanagerApi.injectEndpoints({
  endpoints: (build) => ({
    getStatus: build.query<TransformedAlertmanagerStatusApiResponse, WithDataSourceInformation<GetStatusApiArg>>({
      query: ({ dataSourceUID, implementation }) => ({
        url: `/v2/status`,
        dataSourceUID,
        implementation,
      }),
      transformResponse: (response: AlertmanagerStatus): TransformedAlertmanagerStatusApiResponse => {
        // Use Zod codec to parse YAML and validate the entire transformed response
        return TransformedAlertmanagerStatusApiResponseTransform.parse(response);
      },
      rawResponseSchema: AlertmanagerStatusSchema,
      responseSchema: TransformedAlertmanagerStatusApiResponseSchema,
    }),
    getSilences: build.query({
      query: ({ dataSourceUID, filter, implementation }: WithDataSourceInformation<GetSilencesApiArg>) => ({
        url: `/v2/silences`,
        params: {
          filter,
        },
        dataSourceUID,
        implementation,
      }),
      providesTags: ['Silences'],
      responseSchema: GetSilencesApiResponseSchema,
    }),
    postSilences: build.mutation({
      query: ({ dataSourceUID, postableSilence }: WithDataSourceInformation<PostSilencesApiArg>) => ({
        url: `/v2/silences`,
        method: 'POST',
        body: postableSilence,
        dataSourceUID,
      }),
      invalidatesTags: ['Silences'],
      responseSchema: PostSilencesApiResponseSchema,
    }),
    getSilence: build.query({
      query: ({ dataSourceUID, silenceId }: WithDataSourceInformation<GetSilenceApiArg>) => ({
        url: `/v2/silence/${silenceId}`,
        dataSourceUID,
      }),
      providesTags: ['Silences'],
      responseSchema: GetSilenceApiResponseSchema,
    }),
    deleteSilence: build.mutation({
      query: ({ dataSourceUID, silenceId }: WithDataSourceInformation<DeleteSilenceApiArg>) => ({
        url: `/v2/silence/${silenceId}`,
        method: 'DELETE',
        dataSourceUID,
      }),
      invalidatesTags: ['Silences'],
    }),
    getAlerts: build.query({
      query: ({
        dataSourceUID,
        active,
        silenced,
        inhibited,
        unprocessed,
        filter,
        receiver,
      }: WithDataSourceInformation<GetAlertsApiArg>) => ({
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
      providesTags: ['Alerts'],
      responseSchema: GetAlertsApiResponseSchema,
    }),
    postAlerts: build.mutation({
      query: ({ dataSourceUID, postableAlerts }: WithDataSourceInformation<PostAlertsApiArg>) => ({
        url: `/v2/alerts`,
        method: 'POST',
        body: postableAlerts,
        dataSourceUID,
      }),
      invalidatesTags: ['Alerts', 'AlertGroups'],
    }),
    getAlertGroups: build.query({
      query: ({
        dataSourceUID,
        active,
        silenced,
        inhibited,
        muted,
        filter,
        receiver,
      }: WithDataSourceInformation<GetAlertGroupsApiArg>) => ({
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
      providesTags: ['AlertGroups'],
      responseSchema: GetAlertGroupsApiResponseSchema,
    }),
  }),
});
