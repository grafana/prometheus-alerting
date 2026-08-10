import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { StandardSchemaV1 } from '@standard-schema/spec';
import {
  GetStatusApiArg,
  AlertmanagerStatus,
  DeleteSilenceApiArg,
  DeleteSilenceApiResponse,
  GetAlertGroupsApiArg,
  GetAlertGroupsApiResponse,
  GetAlertGroupsApiResponseSchema,
  GetAlertsApiArg,
  GetAlertsApiResponse,
  GetAlertsApiResponseSchema,
  GetSilenceApiArg,
  GetSilenceApiResponse,
  GetSilenceApiResponseSchema,
  GetSilencesApiArg,
  GetSilencesApiResponse,
  GetSilencesApiResponseSchema,
  PostAlertsApiArg,
  PostAlertsApiResponse,
  PostSilencesApiArg,
  PostSilencesApiResponse,
  PostSilencesApiResponseSchema,
} from '@grafana/external-alertmanager/vanilla';
import {
  ParsedUserConfiguration,
  TransformedStatusToParsedUserConfiguration,
} from '@grafana/external-alertmanager/mimir';

import { getDataSourceSrv } from '@grafana/runtime';
import { AlertManagerDataSourceJsonData } from 'types/datasources';
import { buildDatasourceProxyPath } from '../utils/proxyPath';
import { WithDataSourceInformation, TransformedAlertmanagerStatusApiResponseTransform } from './alertmanager.types';

function createAlertmanagerPath(dataSourceUID: string, path: `/${string}`) {
  const dsSettings = getDataSourceSrv().getInstanceSettings(dataSourceUID);
  const jsonData = dsSettings?.jsonData as AlertManagerDataSourceJsonData;
  const implementation = jsonData?.implementation ?? 'prometheus';

  const prefixSegments = implementation === 'mimir' ? ['alertmanager', 'api'] : ['api'];
  const pathSegments = path.split('/').filter(Boolean);

  return buildDatasourceProxyPath(dataSourceUID, ...prefixSegments, ...pathSegments);
}

// Base API for Prometheus/vanilla Alertmanager
export const baseAlertmanagerApi = createApi({
  reducerPath: 'alertmanagerApi',
  refetchOnFocus: true,
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/datasources/proxy/uid',
  }),
  tagTypes: ['Silences', 'Alerts', 'AlertGroups', 'Configuration'],
  endpoints: () => ({}),
});

// Inject Prometheus-specific endpoints (getStatus)
export const alertmanagerApi = baseAlertmanagerApi.injectEndpoints({
  endpoints: (build) => ({
    // this endpoint returns the entire status object – currently only used by the configuration page.
    // to grab the Alertmanager configuration use "getConfiguration" endpoint.
    getStatus: build.query<AlertmanagerStatus, WithDataSourceInformation<GetStatusApiArg>>({
      query: ({ dataSourceUID }) => ({
        url: createAlertmanagerPath(dataSourceUID, `/v2/status`),
      }),
      providesTags: ['Configuration'],
    }),
    getConfiguration: build.query<ParsedUserConfiguration, WithDataSourceInformation<GetStatusApiArg>>({
      query: ({ dataSourceUID }) => ({
        url: createAlertmanagerPath(dataSourceUID, `/v2/status`),
      }),
      transformResponse: (response: AlertmanagerStatus): ParsedUserConfiguration => {
        // First, transform the status response to get the parsed config
        const transformedStatus = TransformedAlertmanagerStatusApiResponseTransform.parse(response);
        // Then use the codec to convert to ParsedUserConfiguration (Mimir format)
        return TransformedStatusToParsedUserConfiguration.decode(transformedStatus);
      },
      providesTags: ['Configuration'],
    }),
    getSilences: build.query<GetSilencesApiResponse, WithDataSourceInformation<GetSilencesApiArg>>({
      query: ({ dataSourceUID, filter }) => ({
        url: createAlertmanagerPath(dataSourceUID, `/v2/silences`),
        params: {
          filter,
        },
        dataSourceUID,
      }),
      providesTags: ['Silences'],
      responseSchema: GetSilencesApiResponseSchema,
    }),
    postSilences: build.mutation<PostSilencesApiResponse, WithDataSourceInformation<PostSilencesApiArg>>({
      query: ({ dataSourceUID, postableSilence }) => ({
        url: createAlertmanagerPath(dataSourceUID, `/v2/silences`),
        method: 'POST',
        body: postableSilence,
        dataSourceUID,
      }),
      invalidatesTags: ['Silences', 'AlertGroups'],
      responseSchema: PostSilencesApiResponseSchema,
    }),
    getSilence: build.query<GetSilenceApiResponse, WithDataSourceInformation<GetSilenceApiArg>>({
      query: ({ dataSourceUID, silenceId }) => ({
        url: createAlertmanagerPath(dataSourceUID, `/v2/silence/${silenceId}`),
        dataSourceUID,
      }),
      providesTags: ['Silences'],
      responseSchema: GetSilenceApiResponseSchema,
    }),
    deleteSilence: build.mutation<DeleteSilenceApiResponse, WithDataSourceInformation<DeleteSilenceApiArg>>({
      query: ({ dataSourceUID, silenceId }) => ({
        url: createAlertmanagerPath(dataSourceUID, `/v2/silence/${silenceId}`),
        method: 'DELETE',
        dataSourceUID,
      }),
      invalidatesTags: ['Silences', 'AlertGroups'],
    }),
    getAlerts: build.query<GetAlertsApiResponse, WithDataSourceInformation<GetAlertsApiArg>>({
      query: ({ dataSourceUID, active, silenced, inhibited, unprocessed, filter, receiver }) => ({
        url: createAlertmanagerPath(dataSourceUID, `/v2/alerts`),
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
      // Cast needed: zod v4 vendors its own Standard Schema types rather than depending on
      // @standard-schema/spec, causing a module identity mismatch with RTK Query. Safe at runtime.
      // See: https://github.com/colinhacks/zod/issues/4938
      responseSchema: GetAlertsApiResponseSchema as unknown as StandardSchemaV1<GetAlertsApiResponse>,
    }),
    postAlerts: build.mutation<PostAlertsApiResponse, WithDataSourceInformation<PostAlertsApiArg>>({
      query: ({ dataSourceUID, postableAlerts }) => ({
        url: createAlertmanagerPath(dataSourceUID, `/v2/alerts`),
        method: 'POST',
        body: postableAlerts,
        dataSourceUID,
      }),
      invalidatesTags: ['Alerts', 'AlertGroups'],
    }),
    getAlertGroups: build.query<GetAlertGroupsApiResponse, WithDataSourceInformation<GetAlertGroupsApiArg>>({
      query: ({ dataSourceUID, active, silenced, inhibited, muted, filter, receiver }) => ({
        url: createAlertmanagerPath(dataSourceUID, `/v2/alerts/groups`),
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
      // Cast needed: zod v4 vendors its own Standard Schema types rather than depending on
      // @standard-schema/spec, causing a module identity mismatch with RTK Query. Safe at runtime.
      // See: https://github.com/colinhacks/zod/issues/4938
      responseSchema: GetAlertGroupsApiResponseSchema as unknown as StandardSchemaV1<GetAlertGroupsApiResponse>,
    }),
  }),
});
