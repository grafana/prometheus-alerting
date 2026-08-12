import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  RulerRuleGroupDTO,
  RulerRuleGroupDTOSchema,
  GetRulerRuleGroupApiResponseSchema,
} from '@grafana/external-rules/vanilla';
import { z } from 'zod';
import yaml from 'js-yaml';

import { getRulerApiBasePath } from '../../types/rules';
import { getRulesApiPluginType } from '../../utils/datasource';
import { buildDatasourceProxyPath } from '../utils/proxyPath';

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

function buildRulerApiUrl(dataSourceUid: string, ...segments: string[]): string {
  const basePath = getRulerApiBasePath(getRulesApiPluginType(dataSourceUid));
  return buildDatasourceProxyPath(dataSourceUid, ...basePath.split('/'), ...segments);
}

export const rulerApi = createApi({
  reducerPath: 'rulerApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/datasources/proxy/uid' }),
  tagTypes: ['RulerRuleGroup'],
  endpoints: (build) => ({
    getRuleGroup: build.query<RulerRuleGroupDTO | null, GetRuleGroupParams>({
      query: ({ dataSourceUid, namespace, groupName }) => ({
        url: buildRulerApiUrl(dataSourceUid, namespace, groupName),
        responseHandler: 'text',
      }),
      transformResponse: (response: string): RulerRuleGroupDTO | null => {
        if (!response || response.trim() === '') {
          return null;
        }
        try {
          return yaml.load(response) as RulerRuleGroupDTO;
        } catch (error) {
          console.error('Failed to parse YAML response:', error);
          throw error;
        }
      },
      providesTags: (_result, _error, { dataSourceUid, namespace, groupName }) => [
        { type: 'RulerRuleGroup', id: `${dataSourceUid}/${namespace}/${groupName}` },
      ],
      rawResponseSchema: z.string(),
      responseSchema: GetRulerRuleGroupApiResponseSchema,
    }),
    deleteRuleGroup: build.mutation<void, DeleteRuleGroupParams>({
      query: ({ dataSourceUid, namespace, groupName }) => ({
        url: buildRulerApiUrl(dataSourceUid, namespace, groupName),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { dataSourceUid, namespace, groupName }) => [
        { type: 'RulerRuleGroup', id: `${dataSourceUid}/${namespace}/${groupName}` },
      ],
    }),
    upsertRuleGroup: build.mutation<void, UpsertRuleGroupParams>({
      query: ({ dataSourceUid, namespace, payload }) => ({
        url: buildRulerApiUrl(dataSourceUid, namespace),
        method: 'POST',
        headers: {
          'Content-Type': 'application/yaml',
        },
        body: yaml.dump(payload),
        responseHandler: 'text',
      }),
      invalidatesTags: (_result, _error, { dataSourceUid, namespace, payload }) => [
        { type: 'RulerRuleGroup', id: `${dataSourceUid}/${namespace}/${payload.name}` },
      ],
    }),
    getAllRules: build.query<RulerRulesConfigDTO, GetAllRulesParams>({
      query: ({ dataSourceUid }) => ({
        url: buildRulerApiUrl(dataSourceUid),
        responseHandler: 'text',
      }),
      transformResponse: (response: string): RulerRulesConfigDTO => {
        if (!response || response.trim() === '') {
          return {};
        }
        try {
          return yaml.load(response) as RulerRulesConfigDTO;
        } catch (error) {
          console.error('Failed to parse YAML response:', error);
          throw error;
        }
      },
      providesTags: ['RulerRuleGroup'],
      rawResponseSchema: z.string(),
      responseSchema: RulerRulesConfigDTOSchema,
    }),
  }),
});
