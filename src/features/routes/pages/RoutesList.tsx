import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { testIds } from '../../../components/testIds';
import { ConfirmModal, EmptyState } from '@grafana/ui';
import { useRoutes } from '../hooks/useRoutes';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { ViewState } from '../../../components/ViewState';
import { DataSourceError } from '../../../components/AlertmanagerError';
import { t } from '@grafana/i18n';
import { computeInheritedTree } from '@grafana/alerting';
import { RouteCard } from '../components/RouteCard';
import { Route, Receiver } from '@grafana/external-alertmanager/vanilla';
import { RouteWithID } from '@grafana/external-alertmanager/mimir';
import { RouteDrawer, DrawerMode } from '../components/RouteDrawer';
import { ReceiverDrawer } from '../../receivers/components/ReceiverDrawer';
import { useReceivers } from '../../receivers/hooks/useReceivers';
import { useAlertGroups } from '../hooks/useAlertGroups';
import { useRouteMatching, getRouteMatchCount } from '../hooks/useRouteMatching';
import { useAlertmanager } from '../../../hooks/useAlertmanager';
import { useDeleteRoute } from '../hooks/useDeleteRoute';
import { addUniqueIdentifier, findRouteById } from '../utils';
import { InsertPosition } from '../types';

function RoutesPage() {
  const { route, isLoading, error, isSuccess } = useRoutes();
  const { alertGroups, isLoading: isLoadingAlerts } = useAlertGroups();
  const { settings } = useAlertmanager();
  // Track the selected route by id rather than by object, so the drawer always renders the
  // latest fetched data (e.g. right after a successful edit) instead of a stale snapshot.
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedReceiverName, setSelectedReceiverName] = useState<string | null>(null);
  const [triggerFetchReceivers, { receivers = [] }] = useReceivers();

  // State for add mode
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(DrawerMode.View);
  const [referenceRouteId, setReferenceRouteId] = useState<string | undefined>(undefined);
  const [insertPosition, setInsertPosition] = useState<InsertPosition>('child');

  // State for delete confirmation from RouteCard
  const [routeToDelete, setRouteToDelete] = useState<RouteWithID | null>(null);
  const { deleteRoute, isDeleting } = useDeleteRoute();

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

    // computeInheritedTree returns a type from @grafana/alerting/unstable
    // which has matchers as RoutingTreeMatcher[]. We need to convert to
    // @grafana/external-alertmanager Route type which uses matchers as string[].
    // This is a cross-package boundary - the one place where we need type assertion.
    const inheritedTree = computeInheritedTree(normalizedRoute) as unknown as Route;

    return addUniqueIdentifier(inheritedTree);
  }, [route]);

  // Compute matching counts for each route in the tree
  // Type assertion needed for the same package type differences
  const matchingCounts = useRouteMatching(routeTree as Parameters<typeof useRouteMatching>[0], alertGroups);

  const selectedRoute = selectedRouteId && routeTree ? (findRouteById(routeTree, selectedRouteId) ?? null) : null;

  // Find the selected receiver
  const selectedReceiver = useMemo(() => {
    if (!selectedReceiverName) {
      return null;
    }
    return receivers.find((r: Receiver) => r.name === selectedReceiverName) || null;
  }, [selectedReceiverName, receivers]);

  const handleReceiverClick = (receiverName: string) => {
    setSelectedReceiverName(receiverName);
  };

  const handleReceiverDrawerClose = () => {
    setSelectedReceiverName(null);
  };

  const handleRouteDrawerClose = () => {
    setSelectedRouteId(null);
    setSelectedReceiverName(null);
    setDrawerMode(DrawerMode.View);
    setReferenceRouteId(undefined);
  };

  // Handle clicking on a route to view it
  const handleRouteClick = useCallback((route: RouteWithID) => {
    setSelectedRouteId(route.id);
    setDrawerMode(DrawerMode.View);
  }, []);

  // Handle adding a new route
  const handleAddRoute = useCallback((referenceRoute: RouteWithID, position: InsertPosition) => {
    setReferenceRouteId(referenceRoute.id);
    setInsertPosition(position);
    setSelectedRouteId(null); // Clear selected route since we're adding new
    setDrawerMode(DrawerMode.Add);
  }, []);

  // Handle deleting a route (from RouteCard menu)
  const handleDeleteRoute = useCallback((route: RouteWithID) => {
    setRouteToDelete(route);
  }, []);

  // Confirm deletion
  const handleConfirmDelete = useCallback(async () => {
    if (routeToDelete) {
      const success = await deleteRoute(routeToDelete.id);
      if (success) {
        setRouteToDelete(null);
        // Close drawer if the deleted route was selected
        if (selectedRouteId === routeToDelete.id) {
          setSelectedRouteId(null);
        }
      }
    }
  }, [routeToDelete, deleteRoute, selectedRouteId]);

  // Check if the currently selected route can be deleted (not the root route)
  const canDeleteSelectedRoute = Boolean(selectedRoute && selectedRoute.id !== '0');
  const routeToDeleteHasChildren = routeToDelete?.routes && routeToDelete.routes.length > 0;

  return (
    <AlertmanagerPage subTitle={t('routes.page-subtitle', 'Determine how alerts are routed to receivers')}>
      <div data-testid={testIds.routes.container}>
        <ViewState
          isLoading={isLoading}
          isSuccess={isSuccess}
          error={error}
          isEmpty={!routeTree}
          loading={<RouteCard.Skeleton count={3} />}
          renderError={
            <DataSourceError error={error} title={t('routes.error-loading-title', 'Error loading routes')} />
          }
          empty={
            <EmptyState
              message={t('routes.no-routes-message', 'No routing configuration is available in the Alertmanager.')}
              variant="call-to-action"
            />
          }
        >
          {routeTree && (
            <div>
              <RouteCard
                currentRoute={routeTree}
                numberOfMatchingInstances={
                  isLoadingAlerts ? undefined : getRouteMatchCount(matchingCounts, routeTree.id)
                }
                matchingCounts={isLoadingAlerts ? undefined : matchingCounts}
                isDefault={true}
                onRouteClick={handleRouteClick}
                focussedRouteID={selectedRoute?.id}
                onAddRoute={canEdit ? handleAddRoute : undefined}
                onDeleteRoute={canEdit ? handleDeleteRoute : undefined}
                readOnly={!canEdit}
              />
            </div>
          )}
        </ViewState>
      </div>
      {/* Show drawer for viewing/editing selected route OR adding new route */}
      {(selectedRoute || drawerMode === DrawerMode.Add) && (
        <RouteDrawer
          route={selectedRoute}
          onClose={handleRouteDrawerClose}
          onReceiverClick={handleReceiverClick}
          canEdit={canEdit}
          canDelete={canEdit && canDeleteSelectedRoute}
          mode={drawerMode}
          referenceRouteId={referenceRouteId}
          insertPosition={insertPosition}
        />
      )}
      {selectedReceiverName && (
        <ReceiverDrawer receiver={selectedReceiver} onClose={handleReceiverDrawerClose} showBackButton={true} />
      )}

      {/* Delete confirmation modal (from RouteCard menu) */}
      <ConfirmModal
        isOpen={routeToDelete !== null}
        title={t('routes.delete.confirm-title', 'Delete Route')}
        body={
          routeToDeleteHasChildren
            ? t(
                'routes.delete.confirm-body-with-children',
                'Are you sure you want to delete this route? This will also delete all {{count}} child route(s).',
                { count: routeToDelete?.routes?.length ?? 0 }
              )
            : t('routes.delete.confirm-body', 'Are you sure you want to delete this route?')
        }
        confirmText={t('routes.delete.confirm-button', 'Delete')}
        onConfirm={handleConfirmDelete}
        onDismiss={() => setRouteToDelete(null)}
        confirmButtonVariant="destructive"
        disabled={isDeleting}
      />
    </AlertmanagerPage>
  );
}

export default RoutesPage;
