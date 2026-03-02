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
 * GET /api/ruler/:dataSourceUid/api/v1/rules
 * Returns all rule groups for a datasource
 */
const getRulerRulesHandler = () =>
  http.get('/api/ruler/:dataSourceUid/api/v1/rules', () => {
    return HttpResponse.json(mockNamespaces);
  });

/**
 * GET /api/ruler/:dataSourceUid/api/v1/rules/:namespace/:group
 * Returns a specific rule group
 */
const getRulerRuleGroupHandler = () =>
  http.get<{ dataSourceUid: string; namespace: string; group: string }>(
    '/api/ruler/:dataSourceUid/api/v1/rules/:namespace/:group',
    ({ params }) => {
      const { namespace, group } = params;

      const namespaceGroups = mockNamespaces[namespace];
      if (!namespaceGroups) {
        return HttpResponse.json({ message: 'group does not exist\n' }, { status: 404 });
      }

      const matchingGroup = namespaceGroups.find((g) => g.name === group);
      if (!matchingGroup) {
        return HttpResponse.json({ message: 'group does not exist\n' }, { status: 404 });
      }

      return HttpResponse.json({
        name: matchingGroup.name,
        interval: matchingGroup.interval,
        rules: matchingGroup.rules,
      });
    }
  );

/**
 * POST /api/ruler/:dataSourceUid/api/v1/rules/:namespace
 * Creates or updates a rule group in a namespace
 */
const upsertRulerRuleGroupHandler = () =>
  http.post('/api/ruler/:dataSourceUid/api/v1/rules/:namespace', () => {
    return HttpResponse.json({
      status: 'success',
      data: null,
    });
  });

/**
 * DELETE /api/ruler/:dataSourceUid/api/v1/rules/:namespace/:group
 * Deletes a rule group
 */
const deleteRulerRuleGroupHandler = () =>
  http.delete('/api/ruler/:dataSourceUid/api/v1/rules/:namespace/:group', () => {
    return HttpResponse.json({ message: 'Rules deleted' }, { status: 202 });
  });

export const rulerHandlers = [
  getRulerRulesHandler(),
  getRulerRuleGroupHandler(),
  upsertRulerRuleGroupHandler(),
  deleteRulerRuleGroupHandler(),
];
