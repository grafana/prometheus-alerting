/**
 * MSW handlers for Mimir/Cortex Ruler API endpoints.
 * These handle rule group CRUD operations.
 */

import { http, HttpResponse } from 'msw';

import { mockNamespaces as defaultMockNamespaces } from '../fixtures/rule-groups';

// Mutable state for ruler mock - allows tests to modify data
let mockNamespaces = { ...defaultMockNamespaces };

/**
 * Reset ruler state to defaults.
 * Call this in afterEach to ensure test isolation.
 */
export function resetRulerState() {
  mockNamespaces = { ...defaultMockNamespaces };
}

/**
 * Set custom namespaces for a specific test.
 * @example
 * setMockNamespaces({ 'my-namespace': [{ name: 'my-group', rules: [] }] });
 */
export function setMockNamespaces(namespaces: typeof mockNamespaces) {
  mockNamespaces = namespaces;
}

/**
 * Datasource proxy Ruler API endpoints.
 */
const getRulerRulesHandler = (path: string) =>
  http.get(path, () => {
    return HttpResponse.json(mockNamespaces);
  });

/**
 * Returns a specific rule group.
 */
const getRulerRuleGroupHandler = (path: string) =>
  http.get<{ dataSourceUid: string; namespace: string; group: string }>(path, ({ params }) => {
    const { namespace, group } = params;

    const namespaceGroups = mockNamespaces[namespace];
    if (!namespaceGroups) {
      return HttpResponse.json({ message: 'group does not exist\n' }, { status: 404 });
    }

    const matchingGroup = namespaceGroups.find((g) => g.name === group);
    if (!matchingGroup) {
      return HttpResponse.json({ message: 'group does not exist\n' }, { status: 404 });
    }

    // Answer with the group as it is stored -- picking fields apart here would hide the very
    // thing some of these tests check, which is that a write keeps what it read.
    return HttpResponse.json(matchingGroup);
  });

/**
 * Creates or updates a rule group in a namespace.
 */
const upsertRulerRuleGroupHandler = (path: string) =>
  http.post(path, () => {
    return HttpResponse.json({
      status: 'success',
      data: null,
    });
  });

/**
 * Deletes a rule group.
 */
const deleteRulerRuleGroupHandler = (path: string) =>
  http.delete(path, () => {
    return HttpResponse.json({ message: 'Rules deleted' }, { status: 202 });
  });

const datasourceProxyPath = '/api/datasources/proxy/uid/:dataSourceUid';

const prometheusRulerHandlers = [
  getRulerRulesHandler(`${datasourceProxyPath}/config/v1/rules`),
  getRulerRuleGroupHandler(`${datasourceProxyPath}/config/v1/rules/:namespace/:group`),
  upsertRulerRuleGroupHandler(`${datasourceProxyPath}/config/v1/rules/:namespace`),
  deleteRulerRuleGroupHandler(`${datasourceProxyPath}/config/v1/rules/:namespace/:group`),
];

const lokiRulerHandlers = [
  getRulerRulesHandler(`${datasourceProxyPath}/api/prom/rules`),
  getRulerRuleGroupHandler(`${datasourceProxyPath}/api/prom/rules/:namespace/:group`),
  upsertRulerRuleGroupHandler(`${datasourceProxyPath}/api/prom/rules/:namespace`),
  deleteRulerRuleGroupHandler(`${datasourceProxyPath}/api/prom/rules/:namespace/:group`),
];

export const rulerHandlers = [...prometheusRulerHandlers, ...lokiRulerHandlers];
