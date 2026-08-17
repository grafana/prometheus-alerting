import React from 'react';
import { setDataSourceSrv } from '@grafana/runtime';
import { render, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { createMockDataSourceSrv } from '../../../test/mocks/grafana-runtime';
import { TestMemoryRouter } from '../../../test/utils/test-wrapper';

import GroupDetails from './GroupDetails';

// Mock PluginPage component (not an HTTP request, so we mock it directly)
// Recursively render breadcrumb items with their URLs
interface PageNavItem {
  text: string;
  url?: string;
  parentItem?: PageNavItem;
}

function renderBreadcrumbs(pageNav: PageNavItem | undefined): React.ReactNode {
  if (!pageNav) {
    return null;
  }

  const items: Array<{ text: string; url?: string }> = [];
  let current: PageNavItem | undefined = pageNav;
  while (current) {
    items.unshift({ text: current.text, url: current.url });
    current = current.parentItem;
  }

  return (
    <nav data-testid="breadcrumbs">
      {items.map((item, index) => (
        <span key={index} data-testid={`breadcrumb-${index}`}>
          {item.url ? (
            <a href={item.url} data-testid={`breadcrumb-link-${index}`}>
              {item.text}
            </a>
          ) : (
            <span>{item.text}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

vi.mock('@grafana/runtime', async () => ({
  ...(await vi.importActual('@grafana/runtime')),
  PluginPage: ({ children, pageNav }: { children: React.ReactNode; pageNav?: PageNavItem }) => (
    <div data-testid="plugin-page">
      {renderBreadcrumbs(pageNav)}
      {pageNav && <div data-testid="page-title">{pageNav.text}</div>}
      {children}
    </div>
  ),
}));

// Mock DataSourceGroupLoader to avoid complex setup
vi.mock('../list/DataSourceGroupLoader', () => ({
  DataSourceGroupLoader: () => <div data-testid="group-loader" />,
}));

// Mock all API hooks that use RTK Query
// Note: In the future, we can migrate these to use MSW + getBackendSrv mocks
const mockUseGetGroupsQuery = vi.fn();
const mockUseDiscoverFeaturesQuery = vi.fn();
const mockUseGetRulerRuleGroupQuery = vi.fn();

vi.mock('../../../api/rules/prometheus.endpoints', async () => {
  const actual = await vi.importActual<typeof import('../../../api/rules/prometheus.endpoints')>(
    '../../../api/rules/prometheus.endpoints'
  );
  return {
    ...actual,
    prometheusApi: {
      ...actual.prometheusApi,
      useGetGroupsQuery: () => mockUseGetGroupsQuery(),
    },
  };
});

vi.mock('../../../api/rules/featureDiscovery.endpoints', async () => {
  const actual = await vi.importActual<typeof import('../../../api/rules/featureDiscovery.endpoints')>(
    '../../../api/rules/featureDiscovery.endpoints'
  );
  return {
    ...actual,
    useDiscoverFeaturesQuery: () => mockUseDiscoverFeaturesQuery(),
  };
});

vi.mock('../../../api/rules/ruler.endpoints', async () => {
  const actual = await vi.importActual<typeof import('../../../api/rules/ruler.endpoints')>(
    '../../../api/rules/ruler.endpoints'
  );
  return {
    ...actual,
    rulerApi: {
      ...actual.rulerApi,
      useGetRuleGroupQuery: () => mockUseGetRulerRuleGroupQuery(),
    },
  };
});

function renderGroupDetails(path = '/groups/prometheus-1/my-namespace/my-group') {
  return render(
    <TestMemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/groups/:dataSourceUid/:namespace/:groupName" element={<GroupDetails />} />
      </Routes>
    </TestMemoryRouter>
  );
}

describe('GroupDetails', () => {
  beforeEach(() => {
    setDataSourceSrv(createMockDataSourceSrv());
    vi.clearAllMocks();

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

  describe('breadcrumb navigation', () => {
    beforeEach(() => {
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
    });

    it('renders breadcrumb with correct hierarchy: Rules > Namespace > Group', () => {
      renderGroupDetails();

      const breadcrumbs = screen.getByTestId('breadcrumbs');
      expect(breadcrumbs).toBeInTheDocument();

      // Check breadcrumb order: Rules (0) > Namespace (1) > Group (2)
      expect(screen.getByTestId('breadcrumb-0')).toHaveTextContent('Rules');
      expect(screen.getByTestId('breadcrumb-1')).toHaveTextContent('my-namespace');
      expect(screen.getByTestId('breadcrumb-2')).toHaveTextContent('my-group');
    });

    it('namespace breadcrumb links to rules list filtered by namespace', () => {
      renderGroupDetails();

      const namespaceLink = screen.getByTestId('breadcrumb-link-1');
      expect(namespaceLink).toHaveAttribute('href', expect.stringContaining('/a/grafana-prometheusalerting-app/rules'));
      expect(namespaceLink).toHaveAttribute('href', expect.stringContaining('search=namespace'));
      expect(namespaceLink).toHaveAttribute('href', expect.stringContaining('my-namespace'));
    });

    it('Rules breadcrumb links to the rules list page', () => {
      renderGroupDetails();

      const rulesLink = screen.getByTestId('breadcrumb-link-0');
      expect(rulesLink).toHaveAttribute('href', '/a/grafana-prometheusalerting-app/rules');
    });

    it('current page (group) breadcrumb has no link', () => {
      renderGroupDetails();

      // The current page should not be a link
      const groupBreadcrumb = screen.getByTestId('breadcrumb-2');
      expect(groupBreadcrumb.querySelector('a')).not.toBeInTheDocument();
    });

    it('encodes namespace with special characters in the URL', () => {
      mockUseGetGroupsQuery.mockReturnValue({
        data: {
          data: {
            groups: [
              {
                name: 'my-group',
                file: 'namespace with spaces',
                interval: 60,
                rules: [],
              },
            ],
          },
        },
        isLoading: false,
        error: null,
      });

      renderGroupDetails('/groups/prometheus-1/namespace%20with%20spaces/my-group');

      const namespaceLink = screen.getByTestId('breadcrumb-link-1');
      // URL should contain the encoded namespace in the search parameter
      expect(namespaceLink).toHaveAttribute('href', expect.stringContaining('namespace'));
    });
  });
});
