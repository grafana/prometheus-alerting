import React, { useEffect, useMemo, useState } from 'react';
import 'react-loading-skeleton/dist/skeleton.css';
import { testIds } from '../../../components/testIds';
import { EmptyState } from '@grafana/ui';
import { useRoutes } from '../hooks/useRoutes';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { DataSourceError } from '../../../components/AlertmanagerError';
import { t } from '@grafana/i18n';
import { computeInheritedTree } from '@grafana/alerting/unstable';
import { RouteCard } from '../components/RouteCard';
import { RouteWithID } from '@grafana/external-alertmanager/mimir';
import { RouteDrawer } from '../components/RouteDrawer';
import { ReceiverDrawer } from '../../receivers/components/ReceiverDrawer';
import { useReceivers } from '../../receivers/hooks/useReceivers';
import { useAlertGroups } from '../hooks/useAlertGroups';
import { useRouteMatching, getRouteMatchCount } from '../hooks/useRouteMatching';
import { useAlertmanager } from '../../../hooks/useAlertmanager';
import { addUniqueIdentifier } from '../utils';

function RoutesPage() {
  const { route, isLoading, error } = useRoutes();
  const { alertGroups, isLoading: isLoadingAlerts } = useAlertGroups();
  const { settings } = useAlertmanager();
  const [selectedRoute, setSelectedRoute] = useState<RouteWithID | null>(null);
  const [selectedReceiverName, setSelectedReceiverName] = useState<string | null>(null);
  const [triggerFetchReceivers, { receivers }] = useReceivers();

  // Check if the Alertmanager supports editing (Mimir implementation)
  const isMimir = settings?.jsonData?.implementation === 'mimir';
  const canEdit = isMimir;

  // Fetch receivers when component mounts
  useEffect(() => {
    triggerFetchReceivers();
  }, [triggerFetchReceivers]);

  // Compute the inherited tree to show all properties including inherited ones
  const routeTree = useMemo((): RouteWithID | undefined => {
    if (!route) {
      return undefined;
    }

    // Ensure route has required properties for computeInheritedTree
    // Type assertion needed due to package type differences between
    // @grafana/external-alertmanager and @grafana/alerting
    const normalizedRoute = {
      ...route,
      continue: route.continue ?? false,
    } as Parameters<typeof computeInheritedTree>[0];

    // computeInheritedTree returns AlertingRouteWithID which needs to be
    // cast to the external-alertmanager RouteWithID type for RouteCard
    return addUniqueIdentifier(computeInheritedTree(normalizedRoute)) as unknown as RouteWithID;
  }, [route]);

  // Compute matching counts for each route in the tree
  // Type assertion needed for the same package type differences
  const matchingCounts = useRouteMatching(
    routeTree as Parameters<typeof useRouteMatching>[0],
    alertGroups
  );

  // Find the selected receiver
  const selectedReceiver = useMemo(() => {
    if (!selectedReceiverName) {
      return null;
    }
    return receivers.find((r) => r.name === selectedReceiverName) || null;
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
    <AlertmanagerPage subTitle={t('routes.page-subtitle', 'Determine how alerts are routed to receivers')}>
      <div data-testid={testIds.routes.container}>
        {isLoading && <RouteCard.Skeleton count={3} />}
        {error && <DataSourceError error={error} title={t('routes.error-loading-title', 'Error loading routes')} />}
        {!isLoading && routeTree && !error && (
          <div>
            <RouteCard
              currentRoute={routeTree}
              numberOfMatchingInstances={isLoadingAlerts ? undefined : getRouteMatchCount(matchingCounts, routeTree.id)}
              matchingCounts={isLoadingAlerts ? undefined : matchingCounts}
              isDefaultPolicy={true}
              onRouteClick={setSelectedRoute}
              focussedRouteID={selectedRoute?.id}
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
        <RouteDrawer
          route={selectedRoute}
          onClose={handleRouteDrawerClose}
          onReceiverClick={handleReceiverClick}
          canEdit={canEdit}
        />
      )}
      {selectedReceiverName && (
        <ReceiverDrawer receiver={selectedReceiver} onClose={handleReceiverDrawerClose} showBackButton={true} />
      )}
    </AlertmanagerPage>
  );
}

export default RoutesPage;
