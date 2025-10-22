import React, { useMemo, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { testIds } from '../../../components/testIds';
import { Alert, EmptyState } from '@grafana/ui';
import { useRoutes } from '../hooks/useRoutes';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { t } from '@grafana/i18n';
import { computeInheritedTree } from '@grafana/alerting/unstable';
import { RouteCard, type RouteConfig } from '../components/RouteCard';
import { RouteDrawer } from '../components/RouteDrawer';

function RoutesPage() {
  const { route, isLoading, error } = useRoutes();
  const [selectedRoute, setSelectedRoute] = useState<RouteConfig | null>(null);

  // Compute the inherited tree to show all properties including inherited ones
  const routeTree = useMemo(() => {
    if (!route) {
      return undefined;
    }
    // @ts-expect-error - Type mismatch between Route and computeInheritedTree expected type, but they're compatible at runtime
    return computeInheritedTree(route) as any as RouteConfig;
  }, [route]);

  const handleRouteClick = (route: RouteConfig) => {
    setSelectedRoute(route);
  };

  const handleCloseDrawer = () => {
    setSelectedRoute(null);
  };

  return (
    <AlertmanagerPage subTitle={t('routes.page-subtitle', 'Determine how alerts are routed to contact points')}>
      <div data-testid={testIds.routes.container}>
        {isLoading && <Skeleton height={100} count={3} />}
        {error && (
          <Alert title={t('routes.error-loading-title', 'Error loading routes')} severity="error">
            {error instanceof Error ? error.message : t('routes.error-loading-message', 'Failed to fetch routes')}
          </Alert>
        )}
        {!isLoading && routeTree && !error && (
          <div>
            <RouteCard route={routeTree} onClick={handleRouteClick} />
          </div>
        )}
        {!isLoading && !route && !error && (
          <EmptyState
            message={t('routes.no-routes-message', 'No routing configuration is available in the Alertmanager.')}
            variant="call-to-action"
          />
        )}
      </div>
      {selectedRoute && <RouteDrawer route={selectedRoute} onClose={handleCloseDrawer} />}
    </AlertmanagerPage>
  );
}

export default RoutesPage;
