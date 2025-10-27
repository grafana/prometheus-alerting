import React, { useEffect, useMemo, useState } from 'react';
import 'react-loading-skeleton/dist/skeleton.css';
import { testIds } from '../../../components/testIds';
import { Alert, EmptyState } from '@grafana/ui';
import { useRoutes } from '../hooks/useRoutes';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { t } from '@grafana/i18n';
import { computeInheritedTree } from '@grafana/alerting/unstable';
import { RouteCard } from '../components/RouteCard';
import { RouteWithID } from '@grafana/external-alertmanager/mimir';
import { RouteDrawer } from '../components/RouteDrawer';
import { Route } from '@grafana/external-alertmanager/vanilla';
import { ReceiverDrawer } from '../../receivers/components/ReceiverDrawer';
import { useReceivers } from '../../receivers/hooks/useReceivers';

function RoutesPage() {
  const { route, isLoading, error } = useRoutes();
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedReceiverName, setSelectedReceiverName] = useState<string | null>(null);
  const [triggerFetchReceivers, { receivers }] = useReceivers();

  // Fetch receivers when component mounts
  useEffect(() => {
    triggerFetchReceivers();
  }, [triggerFetchReceivers]);

  // Compute the inherited tree to show all properties including inherited ones
  const routeTree = useMemo(() => {
    if (!route) {
      return undefined;
    }
    // Cast the route to the expected type for computeInheritedTree
    // The Route type from vanilla has string[] matchers, but computeInheritedTree expects RoutingTreeMatcher[]
    // This is compatible at runtime since the function handles both formats
    return computeInheritedTree(route as any) as RouteWithID;
  }, [route]);

  // Find the selected receiver
  const selectedReceiver = useMemo(() => {
    if (!selectedReceiverName) {
      return null;
    }
    return receivers.find((r: { name?: string }) => r.name === selectedReceiverName) || null;
  }, [selectedReceiverName, receivers]);

  const handleReceiverClick = (receiverName: string) => {
    setSelectedReceiverName(receiverName);
  };

  const handleReceiverDrawerClose = () => {
    setSelectedReceiverName(null);
  };

  const handleRouteDrawerClose = () => {
    setSelectedRoute(null);
    setSelectedReceiverName(null);
  };

  return (
    <AlertmanagerPage subTitle={t('routes.page-subtitle', 'Determine how alerts are routed to contact points')}>
      <div data-testid={testIds.routes.container}>
        {isLoading && <RouteCard.Skeleton count={3} />}
        {error && (
          <Alert title={t('routes.error-loading-title', 'Error loading routes')} severity="error">
            {error instanceof Error ? error.message : t('routes.error-loading-message', 'Failed to fetch routes')}
          </Alert>
        )}
        {!isLoading && routeTree && !error && (
          <div>
            <RouteCard
              currentRoute={routeTree}
              numberOfMatchingInstances={0}
              isDefaultPolicy={true}
              onRouteClick={setSelectedRoute}
            />
          </div>
        )}
        {!isLoading && !route && !error && (
          <EmptyState
            message={t('routes.no-routes-message', 'No routing configuration is available in the Alertmanager.')}
            variant="call-to-action"
          />
        )}
      </div>
      {selectedRoute && (
        <RouteDrawer route={selectedRoute} onClose={handleRouteDrawerClose} onReceiverClick={handleReceiverClick} />
      )}
      {selectedReceiverName && (
        <ReceiverDrawer receiver={selectedReceiver} onClose={handleReceiverDrawerClose} showBackButton={true} />
      )}
    </AlertmanagerPage>
  );
}

export default RoutesPage;
