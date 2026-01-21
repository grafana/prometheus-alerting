import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import GroupDetails from './GroupDetails';

// Mock ResizeObserver which is not available in jsdom
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock PluginPage component (not an HTTP request, so we mock it directly)
jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  PluginPage: ({ children, pageNav }: { children: React.ReactNode; pageNav?: { text: string } }) => (
    <div data-testid="plugin-page">
      {pageNav && <div data-testid="page-title">{pageNav.text}</div>}
      {children}
    </div>
  ),
}));

// Mock DataSourceGroupLoader to avoid complex setup
jest.mock('../list/DataSourceGroupLoader', () => ({
  DataSourceGroupLoader: () => <div data-testid="group-loader" />,
}));

// Mock all API hooks that use RTK Query
// Note: In the future, we can migrate these to use MSW + getBackendSrv mocks
const mockUseGetGroupsQuery = jest.fn();
const mockUseDiscoverFeaturesQuery = jest.fn();
const mockUseGetRulerRuleGroupQuery = jest.fn();

jest.mock('../../../api/rules/prometheus.endpoints', () => ({
  ...jest.requireActual('../../../api/rules/prometheus.endpoints'),
  prometheusApi: {
    ...jest.requireActual('../../../api/rules/prometheus.endpoints').prometheusApi,
    useGetGroupsQuery: () => mockUseGetGroupsQuery(),
  },
}));

jest.mock('../../../api/rules/featureDiscovery.endpoints', () => ({
  ...jest.requireActual('../../../api/rules/featureDiscovery.endpoints'),
  useDiscoverFeaturesQuery: () => mockUseDiscoverFeaturesQuery(),
}));

jest.mock('../../../api/rules/mimir.endpoints', () => ({
  ...jest.requireActual('../../../api/rules/mimir.endpoints'),
  rulerApi: {
    ...jest.requireActual('../../../api/rules/mimir.endpoints').rulerApi,
    useGetRuleGroupQuery: () => mockUseGetRulerRuleGroupQuery(),
  },
}));

function renderGroupDetails(path = '/groups/prometheus-1/my-namespace/my-group') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/groups/:dataSourceUid/:namespace/:groupName" element={<GroupDetails />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('GroupDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseDiscoverFeaturesQuery.mockReturnValue({
      data: { application: 'prometheus', rulerApiEnabled: false },
      isLoading: false,
      error: null,
    });

    mockUseGetRulerRuleGroupQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    mockUseGetGroupsQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
  });

  describe('loading and error states', () => {
    it('shows loading state while fetching', () => {
      mockUseGetGroupsQuery.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      renderGroupDetails();

      expect(screen.getByText(/loading group details/i)).toBeInTheDocument();
    });

    it('shows error state when API fails', () => {
      mockUseGetGroupsQuery.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch'),
      });

      renderGroupDetails();

      expect(screen.getByText(/error loading group/i)).toBeInTheDocument();
    });

    it('shows group not found when group does not exist', () => {
      mockUseGetGroupsQuery.mockReturnValue({
        data: { data: { groups: [] } },
        isLoading: false,
        error: null,
      });

      renderGroupDetails();

      expect(screen.getByText(/group not found/i)).toBeInTheDocument();
    });
  });

  describe('successful rendering', () => {
    it('renders group details with rules', () => {
      mockUseGetGroupsQuery.mockReturnValue({
        data: {
          data: {
            groups: [
              {
                name: 'my-group',
                file: 'my-namespace',
                interval: 60,
                rules: [{ name: 'rule-1', type: 'alerting', state: 'firing' }],
              },
            ],
          },
        },
        isLoading: false,
        error: null,
      });

      renderGroupDetails();

      expect(screen.getByTestId('group-loader')).toBeInTheDocument();
    });

    it('displays the group name in page title', () => {
      mockUseGetGroupsQuery.mockReturnValue({
        data: {
          data: {
            groups: [
              {
                name: 'my-group',
                file: 'my-namespace',
                interval: 60,
                rules: [],
              },
            ],
          },
        },
        isLoading: false,
        error: null,
      });

      renderGroupDetails();

      expect(screen.getByTestId('page-title')).toHaveTextContent('my-group');
    });
  });
});
