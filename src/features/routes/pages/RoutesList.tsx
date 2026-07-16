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
import { Receiver } from '@grafana/external-alertmanager/vanilla';
import { RouteWithID } from '@grafana/external-alertmanager/mimir';
import { RouteViewDrawer } from '../components/RouteViewDrawer';
import { RouteEditDrawer } from '../components/RouteEditDrawer';
import { ReceiverDrawer } from '../../receivers/components/ReceiverDrawer';
import { useReceivers } from '../../receivers/hooks/useReceivers';
import { useAlertGroups } from '../hooks/useAlertGroups';
import { useRouteMatching, getRouteMatchCount } from '../hooks/useRouteMatching';
import { useAlertmanager } from '../../../hooks/useAlertmanager';
import { useDeleteRoute } from '../hooks/useDeleteRoute';
import { useRouteDrawer } from '../hooks/useRouteDrawer';
import { attachRouteIds } from '../utils';
import { InsertPosition } from '../types';

function RoutesPage() {
  const { route, isLoading, error, isSuccess } = useRoutes();
  const { alertGroups, isLoading: isLoadingAlerts } = useAlertGroups();
  const { settings } = useAlertmanager();
  const [drawerState, dispatchDrawer] = useRouteDrawer();
  const [selectedReceiverName, setSelectedReceiverName] = useState<string | null>(null);
  const [triggerFetchReceivers, { receivers = [] }] = useReceivers();

  // State for delete confirmation (from the RouteCard menu or the view drawer)
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

    // Attach IDs to the raw tree first so they're based on the raw, fetched
    // content — matching what the add/delete/update hooks compute — before
    // computeInheritedTree fills in inherited display fields on child nodes.
    const routeWithIds = attachRouteIds(route);

    // Type assertion needed due to package type differences between
    // @grafana/external-alertmanager and @grafana/alerting. computeInheritedTree
    // returns a type from @grafana/alerting/unstable which has matchers as
    // RoutingTreeMatcher[] instead of string[] - this is the one cross-package
    // boundary where we need type assertions. IDs survive untouched since
    // computeInheritedTree only ever spreads existing own-properties.
    const inheritedTree = computeInheritedTree(routeWithIds);

    return inheritedTree;
  }, [route]);

  // Compute matching counts for each route in the tree
  // Type assertion needed for the same package type differences
  const matchingCounts = useRouteMatching(routeTree as Parameters<typeof useRouteMatching>[0], alertGroups);

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

  // Handle clicking on a route to view it
  const handleRouteClick = useCallback(
    (route: RouteWithID) => {
      dispatchDrawer({ type: 'view', route });
    },
    [dispatchDrawer]
  );

  // Handle editing a route directly (from the RouteCard menu, or the view drawer's Edit button)
  const handleEditRoute = useCallback(
    (route: RouteWithID) => {
      dispatchDrawer({ type: 'edit', route });
    },
    [dispatchDrawer]
  );

  // Handle adding a new route
  const handleAddRoute = useCallback(
    (referenceRoute: RouteWithID, position: InsertPosition) => {
      dispatchDrawer({ type: 'add', referenceRouteId: referenceRoute.id, insertPosition: position });
    },
    [dispatchDrawer]
  );

  // Closes whichever drawer (view/edit/add) is currently open
  const handleDrawerClose = useCallback(() => {
    dispatchDrawer({ type: 'close' });
    setSelectedReceiverName(null);
  }, [dispatchDrawer]);

  // Handle deleting a route (from the RouteCard menu, or the view drawer's Delete button)
  const handleDeleteRoute = useCallback((route: RouteWithID) => {
    setRouteToDelete(route);
  }, []);

  // Confirm deletion
  const handleConfirmDelete = useCallback(async () => {
    if (routeToDelete) {
      const success = await deleteRoute(routeToDelete.id);
      if (success) {
        setRouteToDelete(null);
        // Close the view/edit drawer if the deleted route was open in it
        const openRoute = drawerState.type === 'view' || drawerState.type === 'edit' ? drawerState.route : null;
        if (openRoute?.id === routeToDelete.id) {
          dispatchDrawer({ type: 'close' });
        }
      }
    }
  }, [routeToDelete, deleteRoute, drawerState, dispatchDrawer]);

  // Check if the route currently open in the view drawer can be deleted (not the root route)
  const canDeleteViewingRoute = drawerState.type === 'view' && drawerState.route.id !== routeTree?.id;
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
                focussedRouteID={
                  drawerState.type === 'view' || drawerState.type === 'edit' ? drawerState.route.id : undefined
                }
                onAddRoute={canEdit ? handleAddRoute : undefined}
                onEditRoute={canEdit ? handleEditRoute : undefined}
                onDeleteRoute={canEdit ? handleDeleteRoute : undefined}
                readOnly={!canEdit}
              />
            </div>
          )}
        </ViewState>
      </div>
      {drawerState.type === 'view' && (
        <RouteViewDrawer
          route={drawerState.route}
          onClose={handleDrawerClose}
          onReceiverClick={handleReceiverClick}
          onEdit={canEdit ? () => handleEditRoute(drawerState.route) : undefined}
          onDelete={canEdit && canDeleteViewingRoute ? () => handleDeleteRoute(drawerState.route) : undefined}
        />
      )}
      {drawerState.type === 'edit' && <RouteEditDrawer route={drawerState.route} onClose={handleDrawerClose} />}
      {drawerState.type === 'add' && (
        <RouteEditDrawer
          route={null}
          referenceRouteId={drawerState.referenceRouteId}
          insertPosition={drawerState.insertPosition}
          onClose={handleDrawerClose}
        />
      )}
      {selectedReceiverName && (
        <ReceiverDrawer receiver={selectedReceiver} onClose={handleReceiverDrawerClose} showBackButton={true} />
      )}

      {/* Delete confirmation modal (from the RouteCard menu or the view drawer) */}
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
