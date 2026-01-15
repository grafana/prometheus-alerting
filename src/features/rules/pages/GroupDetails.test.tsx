import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { getDataSourceSrv } from '@grafana/runtime';

import GroupDetails from './GroupDetails';

// Mock ResizeObserver which is not available in jsdom
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock the runtime module
jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getDataSourceSrv: jest.fn(),
  PluginPage: ({ children, pageNav }: { children: React.ReactNode; pageNav?: { text: string } }) => (
    <div data-testid="plugin-page">
      {pageNav && <div data-testid="page-title">{pageNav.text}</div>}
      {children}
    </div>
  ),
}));

// Mock the API hooks
jest.mock('../../../api/rules/prometheus.endpoints', () => ({
  useGetGroupsQuery: jest.fn(),
}));

jest.mock('../../../api/rules/featureDiscovery.endpoints', () => ({
  useDiscoverFeaturesQuery: jest.fn(),
}));

jest.mock('../../../api/rules/mimir.endpoints', () => ({
  useGetRulerRuleGroupQuery: jest.fn(),
}));

// Mock DataSourceGroupLoader to avoid complex setup
jest.mock('../list/DataSourceGroupLoader', () => ({
  DataSourceGroupLoader: () => <div data-testid="group-loader">Rules List</div>,
}));

import { useGetGroupsQuery } from '../../../api/rules/prometheus.endpoints';
import { useDiscoverFeaturesQuery } from '../../../api/rules/featureDiscovery.endpoints';
import { useGetRulerRuleGroupQuery } from '../../../api/rules/mimir.endpoints';

const mockUseGetGroupsQuery = useGetGroupsQuery as jest.Mock;
const mockUseDiscoverFeaturesQuery = useDiscoverFeaturesQuery as jest.Mock;
const mockUseGetRulerRuleGroupQuery = useGetRulerRuleGroupQuery as jest.Mock;
const mockGetDataSourceSrv = getDataSourceSrv as jest.Mock;

function renderGroupDetails(path = '/groups/prometheus-uid/my-namespace/my-group') {
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

    mockGetDataSourceSrv.mockReturnValue({
      getInstanceSettings: () => ({ name: 'Prometheus' }),
    });

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
  });

  it('shows loading state', () => {
    mockUseGetGroupsQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    renderGroupDetails();

    expect(screen.getByText(/loading group details/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseGetGroupsQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch'),
    });

    renderGroupDetails();

    expect(screen.getByText(/error loading group/i)).toBeInTheDocument();
  });

  it('shows group not found when no data', () => {
    mockUseGetGroupsQuery.mockReturnValue({
      data: { data: { groups: [] } },
      isLoading: false,
      error: null,
    });

    renderGroupDetails();

    expect(screen.getByText(/group not found/i)).toBeInTheDocument();
  });

  it('renders group details with rules', () => {
    mockUseGetGroupsQuery.mockReturnValue({
      data: {
        data: {
          groups: [
            {
              name: 'my-group',
              file: 'my-namespace',
              interval: 60,
              rules: [{ name: 'rule-1', type: 'alerting' }],
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
});
