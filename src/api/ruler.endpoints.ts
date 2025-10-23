import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  RulerRuleGroupDTO,
  RulerRuleGroupDTOSchema,
  GetRulerRuleGroupApiResponseSchema,
} from '@grafana/external-rules/vanilla';
import { z } from 'zod';

interface GetRuleGroupParams {
  dataSourceUid: string;
  namespace: string;
  groupName: string;
}

interface DeleteRuleGroupParams {
  dataSourceUid: string;
  namespace: string;
  groupName: string;
}

interface UpsertRuleGroupParams {
  dataSourceUid: string;
  namespace: string;
  payload: RulerRuleGroupDTO;
}

interface GetAllRulesParams {
  dataSourceUid: string;
}

// Ruler rules config is a map of namespace -> array of rule groups
const RulerRulesConfigDTOSchema = z.record(z.string(), z.array(RulerRuleGroupDTOSchema));
export type RulerRulesConfigDTO = z.infer<typeof RulerRulesConfigDTOSchema>;

export const rulerApi = createApi({
  reducerPath: 'rulerApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['RulerRuleGroup'],
  endpoints: (build) => ({
    getRuleGroup: build.query<RulerRuleGroupDTO | null, GetRuleGroupParams>({
      query: ({ dataSourceUid, namespace, groupName }) => ({
        url: `api/ruler/${dataSourceUid}/api/v1/rules/${encodeURIComponent(namespace)}/${encodeURIComponent(
          groupName
        )}`,
      }),
      providesTags: (_result, _error, { dataSourceUid, namespace, groupName }) => [
        { type: 'RulerRuleGroup', id: `${dataSourceUid}/${namespace}/${groupName}` },
      ],
      responseSchema: GetRulerRuleGroupApiResponseSchema,
    }),
    deleteRuleGroup: build.mutation<void, DeleteRuleGroupParams>({
      query: ({ dataSourceUid, namespace, groupName }) => ({
        url: `api/ruler/${dataSourceUid}/api/v1/rules/${encodeURIComponent(namespace)}/${encodeURIComponent(
          groupName
        )}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { dataSourceUid, namespace, groupName }) => [
        { type: 'RulerRuleGroup', id: `${dataSourceUid}/${namespace}/${groupName}` },
      ],
    }),
    upsertRuleGroup: build.mutation<void, UpsertRuleGroupParams>({
      query: ({ dataSourceUid, namespace, payload }) => ({
        url: `api/ruler/${dataSourceUid}/api/v1/rules/${encodeURIComponent(namespace)}`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: (_result, _error, { dataSourceUid, namespace, payload }) => [
        { type: 'RulerRuleGroup', id: `${dataSourceUid}/${namespace}/${payload.name}` },
      ],
    }),
    getAllRules: build.query<RulerRulesConfigDTO, GetAllRulesParams>({
      query: ({ dataSourceUid }) => ({
        url: `api/ruler/${dataSourceUid}/api/v1/rules`,
      }),
      providesTags: ['RulerRuleGroup'],
      responseSchema: RulerRulesConfigDTOSchema,
    }),
  }),
});

export const {
  useGetRuleGroupQuery,
  useLazyGetRuleGroupQuery,
  useDeleteRuleGroupMutation,
  useUpsertRuleGroupMutation,
  useGetAllRulesQuery,
  useLazyGetAllRulesQuery,
} = rulerApi;

// Export aliases for backward compatibility with existing code
export const useGetRulerRuleGroupQuery = useGetRuleGroupQuery;
export const useLazyGetRulerRuleGroupQuery = useLazyGetRuleGroupQuery;
