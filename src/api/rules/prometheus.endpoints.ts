import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import {
  PromRuleGroupDTO,
  GetPromRulesApiResponse,
  GetPromRulesApiResponseSchema,
} from '@grafana/external-rules/vanilla';

import { produce } from 'immer';

import { DataSourceRulesSourceIdentifier, getPrometheusRulesApiBasePath } from '../../types/rules';
import { getRulesApiPluginType } from '../../utils/datasource';
import { buildDatasourceProxyPath } from '../utils/proxyPath';

interface PromRulesOptions {
  ruleSource: Pick<DataSourceRulesSourceIdentifier, 'uid'>;
  namespace?: string;
  groupName?: string;
  ruleName?: string;
  groupLimit?: number;
  excludeAlerts?: boolean;
  groupNextToken?: string;
}

export const prometheusApi = createApi({
  reducerPath: 'prometheusApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/datasources/proxy/uid' }),
  tagTypes: ['Rules'],
  endpoints: (build) => ({
    getGroups: build.query<GetPromRulesApiResponse, PromRulesOptions>({
      query: ({ ruleSource, namespace, groupName, ruleName, groupLimit, excludeAlerts, groupNextToken }) => {
        const basePath = getPrometheusRulesApiBasePath(getRulesApiPluginType(ruleSource.uid));
        return {
          url: buildDatasourceProxyPath(ruleSource.uid, ...basePath.split('/')),
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
      transformResponse: (response: GetPromRulesApiResponse) => {
        return { ...response, data: { ...response.data, groups: response.data.groups.map(normalizeRuleGroup) } };
      },
      // Tagged per data source so a write to one data source doesn't refetch the rules of
      // every other one. Invalidate with { type: 'Rules', id: <uid> } – a type-only
      // invalidation of 'Rules' does not match these entries.
      providesTags: (_result, _error, { ruleSource }) => [{ type: 'Rules' as const, id: ruleSource.uid }],
      responseSchema: GetPromRulesApiResponseSchema,
    }),
  }),
});

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
