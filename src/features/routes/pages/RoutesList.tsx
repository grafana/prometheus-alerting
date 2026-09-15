import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { testIds } from '../../../components/testIds';
import { ConfirmModal, EmptyState } from '@grafana/ui';
import { useRoutes } from '../hooks/useRoutes';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { ViewState } from '../../../components/ViewState';
import { isAbilityAllowed } from '../../../access-control/abilities';
import { RouteAction } from '../../../access-control/abilities.routes';
import { t } from '@grafana/i18n';
import { computeInheritedTree } from '@grafana/alerting';
import { RouteCard, RouteCardActions } from '../components/RouteCard';
import { AlertmanagerError } from '../../../components/AlertmanagerError';
import { Receiver } from '@grafana/external-alertmanager/vanilla';
import { findExistingRoute, type RouteWithID } from '@grafana/external-alertmanager/mimir';
import { RouteViewDrawer } from '../components/RouteViewDrawer';
import { RouteEditDrawer } from '../components/RouteEditDrawer';
import { ReceiverDrawer } from '../../receivers/components/ReceiverDrawer';
import { useReceivers } from '../../receivers/hooks/useReceivers';
import { useAlertGroups } from '../hooks/useAlertGroups';
import { useRouteMatching } from '../hooks/useRouteMatching';
import { useDeleteRoute } from '../hooks/useDeleteRoute';
import { useRouteDrawer } from '../hooks/useRouteDrawer';
import { useRouteAbilities } from '../hooks/useRouteAbilities';
import { attachRouteIds, isRootRoute } from '../utils';
import { getRouteMatchCount } from '../utils/routeMatching';
import { InsertPosition } from '../types';

function RoutesPage() {
  const { route, isLoading, error, isSuccess } = useRoutes();
  const abilities = useRouteAbilities();
  const canMutateRoutes = isAbilityAllowed(abilities[RouteAction.MutateRoutes]);
  const canViewInstances = isAbilityAllowed(abilities[RouteAction.ViewInstances]);
  const {
    alertGroups,
    isLoading: isLoadingAlerts,
    error: alertGroupsError,
  } = useAlertGroups({ skip: !canViewInstances });
  const [drawerState, dispatchDrawer] = useRouteDrawer();
  const [selectedReceiverName, setSelectedReceiverName] = useState<string | null>(null);
  const [triggerFetchReceivers, { receivers = [] }] = useReceivers();

  // State for delete confirmation (from the RouteCard menu or the view drawer)
  const [routeToDelete, setRouteToDelete] = useState<RouteWithID | null>(null);
  const { deleteRoute, isDeleting } = useDeleteRoute();

  // Fetch receivers when component mounts
  useEffect(() => {
    triggerFetchReceivers();
  }, [triggerFetchReceivers]);

  const routeWithIds = useMemo(() => (route ? attachRouteIds(route) : undefined), [route]);
  const routeTree = useMemo(() => (routeWithIds ? computeInheritedTree(routeWithIds) : undefined), [routeWithIds]);

  const matchingCounts = useRouteMatching(routeWithIds, alertGroups);
  const canShowMatchingCounts = canViewInstances && !isLoadingAlerts && !alertGroupsError;

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

  const resolveConfiguredRoute = useCallback(
    (id: string) => (routeWithIds ? findExistingRoute(id, routeWithIds) : undefined),
    [routeWithIds]
  );

  const handleRouteClick = useCallback(
    (route: RouteWithID) => {
      const configuredRoute = resolveConfiguredRoute(route.id);
      if (configuredRoute) {
        dispatchDrawer({ type: 'view', route: configuredRoute });
      }
    },
    [dispatchDrawer, resolveConfiguredRoute]
  );

  const handleEditRoute = useCallback(
    (route: RouteWithID) => {
      const configuredRoute = resolveConfiguredRoute(route.id);
      if (configuredRoute) {
        dispatchDrawer({ type: 'edit', route: configuredRoute });
      }
    },
    [dispatchDrawer, resolveConfiguredRoute]
  );

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
  const handleDeleteRoute = useCallback(
    (route: RouteWithID) => {
      const configuredRoute = resolveConfiguredRoute(route.id);
      if (configuredRoute) {
        setRouteToDelete(configuredRoute);
      }
    },
    [resolveConfiguredRoute]
  );

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
  const canDeleteViewingRoute = drawerState.type === 'view' && drawerState.route.id !== routeWithIds?.id;
  const routeToDeleteHasChildren = routeToDelete?.routes && routeToDelete.routes.length > 0;

  const routeCardActions: RouteCardActions = canMutateRoutes
    ? {
        onAddRoute: handleAddRoute,
        onEditRoute: handleEditRoute,
        onDeleteRoute: handleDeleteRoute,
      }
    : { readOnly: true };

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
            <AlertmanagerError error={error} title={t('routes.error-loading-title', 'Error loading routes')} />
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
                  canShowMatchingCounts ? getRouteMatchCount(matchingCounts, routeTree.id) : undefined
                }
                matchingCounts={canShowMatchingCounts ? matchingCounts : undefined}
                isDefault={true}
                onRouteClick={handleRouteClick}
                focussedRouteID={
                  drawerState.type === 'view' || drawerState.type === 'edit' ? drawerState.route.id : undefined
                }
                {...routeCardActions}
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
          onEdit={canMutateRoutes ? () => handleEditRoute(drawerState.route) : undefined}
          onDelete={canMutateRoutes && canDeleteViewingRoute ? () => handleDeleteRoute(drawerState.route) : undefined}
        />
      )}
      {drawerState.type === 'edit' && canMutateRoutes && (
        <RouteEditDrawer
          route={drawerState.route}
          onClose={handleDrawerClose}
          isRoot={isRootRoute(drawerState.route, routeWithIds)}
        />
      )}
      {drawerState.type === 'add' && canMutateRoutes && (
        <RouteEditDrawer
          route={null}
          referenceRouteId={drawerState.referenceRouteId}
          insertPosition={drawerState.insertPosition}
          onClose={handleDrawerClose}
        />
      )}
      {selectedReceiverName && (
        <ReceiverDrawer
          receiver={selectedReceiver}
          onClose={handleReceiverDrawerClose}
          showBackButton={true}
          readOnly={true}
        />
      )}

      {/* Delete confirmation modal (from the RouteCard menu or the view drawer) */}
      <ConfirmModal
        isOpen={canMutateRoutes && routeToDelete !== null}
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
        confirmVariant="destructive"
        disabled={isDeleting}
      />
    </AlertmanagerPage>
  );
}

export default RoutesPage;
