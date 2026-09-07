import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { RulerRuleGroupDTO, GetRulerRuleGroupApiResponseSchema } from '@grafana/external-rules/vanilla';
import { RulerRulesConfigDTOSchema, type RulerBackend, type RulerRulesConfigDTO } from '@grafana/external-rules/ruler';
import { z } from 'zod';

import { toRtkQueryError } from '../../utils/errors';

import { flavorContext, getFlavorOrThrow } from './flavors/registry';

export type { RulerRulesConfigDTO };

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

interface GetRuleNamespaceYamlParams {
  dataSourceUid: string;
  namespace: string;
}

interface GetAllRulesParams {
  dataSourceUid: string;
}

function rulerBackend(dataSourceUid: string): RulerBackend {
  return getFlavorOrThrow(dataSourceUid).createRulerBackend(flavorContext(dataSourceUid));
}

/**
 * Runs a Ruler operation and converts a rejection into the `FetchBaseQueryError` shape RTK Query
 * expects. HTTP status is preserved, so callers can keep using `isNotFoundError` to tell "the
 * group does not exist" apart from "the request failed".
 */
async function run<T>(operation: () => Promise<T>): Promise<{ data: T } | { error: FetchBaseQueryError }> {
  try {
    return { data: await operation() };
  } catch (error) {
    return { error: toRtkQueryError(error) };
  }
}

/**
 * Rule CRUD, delegated to the data source's flavor.
 *
 * The transport, paths, and payload format belong to the flavor (see `./flavors/registry`); this
 * layer owns only the cache — keys, tags, invalidation, and response validation — so adding a
 * flavor cannot change how any of that behaves.
 */
export const rulerApi = createApi({
  reducerPath: 'rulerApi',
  baseQuery: fakeBaseQuery<FetchBaseQueryError>(),
  tagTypes: ['RulerRuleGroup'],
  endpoints: (build) => ({
    getRuleGroup: build.query<RulerRuleGroupDTO | null, GetRuleGroupParams>({
      queryFn: ({ dataSourceUid, namespace, groupName }) =>
        run(() => rulerBackend(dataSourceUid).getRuleGroup(namespace, groupName)),
      providesTags: (_result, _error, { dataSourceUid, namespace, groupName }) => [
        { type: 'RulerRuleGroup', id: `${dataSourceUid}/${namespace}/${groupName}` },
      ],
      responseSchema: GetRulerRuleGroupApiResponseSchema,
    }),
    getRuleNamespaceYaml: build.query<string, GetRuleNamespaceYamlParams>({
      queryFn: ({ dataSourceUid, namespace }) => run(() => rulerBackend(dataSourceUid).getRuleNamespaceYaml(namespace)),
      providesTags: (_result, _error, { dataSourceUid, namespace }) => [
        { type: 'RulerRuleGroup', id: `${dataSourceUid}/${namespace}` },
      ],
      responseSchema: z.string(),
    }),
    deleteRuleGroup: build.mutation<void, DeleteRuleGroupParams>({
      queryFn: ({ dataSourceUid, namespace, groupName }) =>
        run(() => rulerBackend(dataSourceUid).deleteRuleGroup(namespace, groupName)),
      invalidatesTags: (_result, _error, { dataSourceUid, namespace, groupName }) => [
        { type: 'RulerRuleGroup', id: `${dataSourceUid}/${namespace}/${groupName}` },
        { type: 'RulerRuleGroup', id: `${dataSourceUid}/${namespace}` },
      ],
    }),
    upsertRuleGroup: build.mutation<void, UpsertRuleGroupParams>({
      queryFn: ({ dataSourceUid, namespace, payload }) =>
        run(() => rulerBackend(dataSourceUid).upsertRuleGroup(namespace, payload)),
      invalidatesTags: (_result, _error, { dataSourceUid, namespace, payload }) => [
        { type: 'RulerRuleGroup', id: `${dataSourceUid}/${namespace}/${payload.name}` },
        { type: 'RulerRuleGroup', id: `${dataSourceUid}/${namespace}` },
      ],
    }),
    getAllRules: build.query<RulerRulesConfigDTO, GetAllRulesParams>({
      queryFn: ({ dataSourceUid }) => run(() => rulerBackend(dataSourceUid).getAllRules()),
      providesTags: ['RulerRuleGroup'],
      responseSchema: RulerRulesConfigDTOSchema,
    }),
  }),
});
