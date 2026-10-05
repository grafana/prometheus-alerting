import React from 'react';
import { render, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { rs } from '@rstest/core';
import { stringifyIdentifier } from '@grafana/external-rules/identifiers';

import { TestMemoryRouter } from '../../../test/utils/test-wrapper';
import type { RuleDetailsResult } from '../hooks/useRuleDetails';

import RuleDetails from './RuleDetails';
import * as grafanaRuntimeActual from '@grafana/runtime' with { rstest: 'importActual' };

rs.mock('@grafana/runtime', () => ({
  ...grafanaRuntimeActual,
  PluginPage: ({ children, pageNav }: { children: React.ReactNode; pageNav?: { text: string } }) => (
    <div data-testid="plugin-page">
      {pageNav && <div data-testid="page-title">{pageNav.text}</div>}
      {children}
    </div>
  ),
}));

const mockUseRuleDetails = rs.fn<() => RuleDetailsResult>();

rs.mock('../hooks/useRuleDetails', () => ({
  useRuleDetails: () => mockUseRuleDetails(),
}));

rs.mock('../hooks/useRuleConsistencyCheck', () => ({
  useRuleCreationConsistencyCheck: () => ({ isConsistent: false, status: 'idle' }),
}));

// The details view pulls in the whole rule detail UI, which isn't what these tests are about.
rs.mock('../components/RuleDetailsView', () => ({
  RuleDetailsView: () => <div data-testid="rule-details-view" />,
}));

const validIdentifier = stringifyIdentifier({
  type: 'prometheus',
  uid: 'prom-uid',
  namespace: 'my-namespace',
  groupName: 'my-group',
  ruleName: 'my-rule',
  ruleHash: 'abc123',
});

function renderRuleDetails(ruleIdentifier: string) {
  return render(
    <TestMemoryRouter initialEntries={[`/rules/${ruleIdentifier}`]}>
      <Routes>
        <Route path="/rules/:ruleIdentifier" element={<RuleDetails />} />
      </Routes>
    </TestMemoryRouter>
  );
}

describe('RuleDetails', () => {
  beforeEach(() => {
    rs.clearAllMocks();

    mockUseRuleDetails.mockReturnValue({
      promRule: { name: 'my-rule', type: 'alerting', state: 'inactive', health: 'ok', query: 'up == 0', labels: {} },
      dataSourceUid: 'prom-uid',
      namespace: 'my-namespace',
      groupName: 'my-group',
      hasRulerApi: false,
      loading: false,
      refetch: rs.fn(),
    } as RuleDetailsResult);
  });

  describe.each([
    ['an unparseable identifier', 'totally-bogus-identifier'],
    ['a broken percent-escape', '%E0%A4%A'],
  ])('with %s in the URL', (_reason, ruleIdentifier) => {
    it('shows rule not found with a way back to the list, and never asks for rule data', () => {
      renderRuleDetails(ruleIdentifier);

      expect(screen.getByTestId('page-title')).toHaveTextContent(/rule not found/i);
      expect(screen.getByText(/the requested rule could not be found/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to rules/i })).toHaveAttribute(
        'href',
        '/a/grafana-prometheusalerting-app/rules'
      );
      expect(mockUseRuleDetails).not.toHaveBeenCalled();
    });
  });

  it('shows rule not found when the identifier is valid but no rule matches', () => {
    mockUseRuleDetails.mockReturnValue({
      dataSourceUid: 'prom-uid',
      namespace: 'my-namespace',
      groupName: 'my-group',
      hasRulerApi: false,
      loading: false,
      refetch: rs.fn(),
    } as RuleDetailsResult);

    renderRuleDetails(validIdentifier);

    expect(screen.getByTestId('page-title')).toHaveTextContent(/rule not found/i);
    expect(screen.getByText(/the requested rule could not be found/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to rules/i })).toBeInTheDocument();
  });

  it('renders the rule for a valid identifier', () => {
    renderRuleDetails(validIdentifier);

    expect(screen.getByTestId('rule-details-view')).toBeInTheDocument();
    expect(screen.queryByText(/the requested rule could not be found/i)).not.toBeInTheDocument();
  });
});
