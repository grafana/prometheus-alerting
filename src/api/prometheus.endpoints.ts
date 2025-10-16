import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { PromRuleGroupDTO } from '@grafana/external-rules/vanilla';

import { produce } from 'immer';

export interface PromRulesResponse {
  status: string;
  data: {
    groups: PromRuleGroupDTO[];
    groupNextToken?: string;
  };
  errorType?: string;
  error?: string;
}

interface PromRulesOptions {
  ruleSource: { uid: string };
  namespace?: string;
  groupName?: string;
  ruleName?: string;
  groupLimit?: number;
  excludeAlerts?: boolean;
  groupNextToken?: string;
}

interface DeleteRuleOptions {
  dataSourceUid: string;
  namespace: string;
  groupName: string;
}

export const prometheusApi = createApi({
  reducerPath: 'prometheusApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Rules'],
  endpoints: (build) => ({
    getGroups: build.query<PromRulesResponse, PromRulesOptions>({
      query: ({ ruleSource, namespace, groupName, ruleName, groupLimit, excludeAlerts, groupNextToken }) => {
        return {
          url: `api/prometheus/${ruleSource.uid}/api/v1/rules`,
          params: {
            file: namespace, // Mimir
            'file[]': namespace, // Prometheus
            rule_group: groupName, // Mimir
            'rule_group[]': groupName, // Prometheus
            rule_name: ruleName, // Mimir
            'rule_name[]': ruleName, // Prometheus
            exclude_alerts: excludeAlerts?.toString(),
            group_limit: groupLimit?.toFixed(0),
            group_next_token: groupNextToken,
          },
        };
      },
      transformResponse: (response: PromRulesResponse) => {
        return { ...response, data: { ...response.data, groups: response.data.groups.map(normalizeRuleGroup) } };
      },
      providesTags: ['Rules'],
    }),
    deleteRuleGroup: build.mutation<void, DeleteRuleOptions>({
      query: ({ dataSourceUid, namespace, groupName }) => ({
        url: `api/ruler/${dataSourceUid}/api/v1/rules/${encodeURIComponent(namespace)}/${encodeURIComponent(
          groupName
        )}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Rules'],
    }),
  }),
});

export const { useGetGroupsQuery, useLazyGetGroupsQuery, useDeleteRuleGroupMutation } = prometheusApi;

function normalizeRuleGroup(group: PromRuleGroupDTO): PromRuleGroupDTO {
  return produce(group, (draft) => {
    draft.rules.forEach((rule) => {
      rule.query = rule.query || '';
      if (rule.type === 'alerting') {
        // There's a possibility that a custom/unexpected datasource might response with
        // `type: alerting` but no state
        // In this case, we fall back to `Inactive` state so that elsewhere in the UI we don't fail/have to handle the edge case
        // and log a message so we can identify how frequently this might be happening
        if (!rule.state) {
          rule.state = 'inactive';
        }
      }
    });
  });
}
