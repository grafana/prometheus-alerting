import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { RulerRuleGroupDTO, GetRulerRuleGroupApiResponseSchema } from '@grafana/external-rules/vanilla';

interface DeleteRuleOptions {
  dataSourceUid: string;
  namespace: string;
  groupName: string;
}

interface GetRulerRuleGroupOptions {
  dataSourceUid: string;
  namespace: string;
  groupName: string;
}

export const rulerApi = createApi({
  reducerPath: 'rulerApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['RulerRules'],
  endpoints: (build) => ({
    getRulerRuleGroup: build.query<RulerRuleGroupDTO | null, GetRulerRuleGroupOptions>({
      query: ({ dataSourceUid, namespace, groupName }) => ({
        url: `api/ruler/${dataSourceUid}/api/v1/rules/${encodeURIComponent(namespace)}/${encodeURIComponent(
          groupName
        )}`,
        params: {
          subtype: 'mimir',
        },
      }),
      transformErrorResponse: (response) => {
        // Return null for 404 errors (group not found) instead of throwing
        if (response.status === 404) {
          return null;
        }
        return response;
      },
      providesTags: (_result, _error, { dataSourceUid, namespace, groupName }) => [
        { type: 'RulerRules' as const, id: `${dataSourceUid}/${namespace}/${groupName}` },
      ],
      responseSchema: GetRulerRuleGroupApiResponseSchema,
    }),
    deleteRuleGroup: build.mutation<void, DeleteRuleOptions>({
      query: ({ dataSourceUid, namespace, groupName }) => ({
        url: `api/ruler/${dataSourceUid}/api/v1/rules/${encodeURIComponent(namespace)}/${encodeURIComponent(
          groupName
        )}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['RulerRules'],
    }),
  }),
});

export const { useGetRulerRuleGroupQuery, useDeleteRuleGroupMutation } = rulerApi;
