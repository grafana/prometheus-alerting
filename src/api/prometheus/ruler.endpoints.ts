import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RulerRuleGroupDTO, GetRulerRuleGroupApiResponseSchema } from '@grafana/external-rules/vanilla';

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
  }),
});

export const { useGetRuleGroupQuery, useLazyGetRuleGroupQuery, useDeleteRuleGroupMutation } = rulerApi;

// Export aliases for backward compatibility with existing code
export const useGetRulerRuleGroupQuery = useGetRuleGroupQuery;
export const useLazyGetRulerRuleGroupQuery = useLazyGetRuleGroupQuery;
