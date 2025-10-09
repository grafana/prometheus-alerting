import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  GetStatusApiResponse,
  GetStatusApiArg,
  GetReceiversApiResponse,
  GetReceiversApiArg,
  GetSilencesApiResponse,
  GetSilencesApiArg,
  PostSilencesApiResponse,
  PostSilencesApiArg,
  GetSilenceApiResponse,
  GetSilenceApiArg,
  DeleteSilenceApiResponse,
  DeleteSilenceApiArg,
  GetAlertsApiResponse,
  GetAlertsApiArg,
  PostAlertsApiResponse,
  PostAlertsApiArg,
  GetAlertGroupsApiResponse,
  GetAlertGroupsApiArg,
} from "./types";

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: "/" }),
  endpoints: (build) => ({
    getStatus: build.query<GetStatusApiResponse, GetStatusApiArg>({
      query: () => ({ url: `/status` }),
    }),
    getReceivers: build.query<GetReceiversApiResponse, GetReceiversApiArg>({
      query: () => ({ url: `/receivers` }),
    }),
    getSilences: build.query<GetSilencesApiResponse, GetSilencesApiArg>({
      query: (queryArg) => ({
        url: `/silences`,
        params: {
          filter: queryArg.filter,
        },
      }),
    }),
    postSilences: build.mutation<PostSilencesApiResponse, PostSilencesApiArg>({
      query: (queryArg) => ({
        url: `/silences`,
        method: "POST",
        body: queryArg.postableSilence,
      }),
    }),
    getSilence: build.query<GetSilenceApiResponse, GetSilenceApiArg>({
      query: (queryArg) => ({ url: `/silence/${queryArg.silenceId}` }),
    }),
    deleteSilence: build.mutation<
      DeleteSilenceApiResponse,
      DeleteSilenceApiArg
    >({
      query: (queryArg) => ({
        url: `/silence/${queryArg.silenceId}`,
        method: "DELETE",
      }),
    }),
    getAlerts: build.query<GetAlertsApiResponse, GetAlertsApiArg>({
      query: (queryArg) => ({
        url: `/alerts`,
        params: {
          active: queryArg.active,
          silenced: queryArg.silenced,
          inhibited: queryArg.inhibited,
          unprocessed: queryArg.unprocessed,
          filter: queryArg.filter,
          receiver: queryArg.receiver,
        },
      }),
    }),
    postAlerts: build.mutation<PostAlertsApiResponse, PostAlertsApiArg>({
      query: (queryArg) => ({
        url: `/alerts`,
        method: "POST",
        body: queryArg.postableAlerts,
      }),
    }),
    getAlertGroups: build.query<
      GetAlertGroupsApiResponse,
      GetAlertGroupsApiArg
    >({
      query: (queryArg) => ({
        url: `/alerts/groups`,
        params: {
          active: queryArg.active,
          silenced: queryArg.silenced,
          inhibited: queryArg.inhibited,
          muted: queryArg.muted,
          filter: queryArg.filter,
          receiver: queryArg.receiver,
        },
      }),
    }),
  }),
});
