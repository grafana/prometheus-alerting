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
import { findExistingRoute, Receiver, type RouteWithID } from '@grafana/external-alertmanager/vanilla';
import { RouteViewDrawer } from '../components/RouteViewDrawer';
import { RouteEditDrawer } from '../components/RouteEditDrawer';
import { ReceiverDrawer } from '../../receivers/components/ReceiverDrawer';
import { useReceivers } from '../../receivers/hooks/useReceivers';
import { useAlertGroups } from '../hooks/useAlertGroups';
import { getRouteMatchCount, useRouteMatching } from '../hooks/useRouteMatching';
import { useDeleteRoute } from '../hooks/useDeleteRoute';
import { useRouteDrawer } from '../hooks/useRouteDrawer';
import { useRouteAbilities } from '../hooks/useRouteAbilities';
import { attachRouteIds, isRootRoute } from '../utils';
import { InsertPosition } from '../types';
import { useURLSearchParams } from '../../../hooks/useURLSearchParams';
import { useAlertmanager } from '../../../hooks/useAlertmanager';
import { ALERTMANAGER_QUERY_PARAM } from '../../../constants';

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
  // The route open in the view drawer lives in the URL (?routeId=), along with the Alertmanager it
  // belongs to, so the link can be shared
  const [searchParams, updateSearchParams] = useURLSearchParams();
  const { uid: alertmanagerUID } = useAlertmanager();
  const viewedRouteId = searchParams.get('routeId');

  // State for delete confirmation (from the RouteCard menu or the view drawer)
  const [routeToDelete, setRouteToDelete] = useState<RouteWithID | null>(null);
  const { deleteRoute, isDeleting } = useDeleteRoute();

  // Fetch receivers when component mounts
  useEffect(() => {
    triggerFetchReceivers();
  }, [triggerFetchReceivers]);

  const routeWithIds = useMemo(() => (route ? attachRouteIds(route) : undefined), [route]);
  const routeTree = useMemo(() => (routeWithIds ? computeInheritedTree(routeWithIds) : undefined), [routeWithIds]);

  const { counts: matchingCounts } = useRouteMatching(routeTree, alertGroups);
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

  // Only look the route up while no edit/add drawer is open, so the two never show at once
  const viewedRoute =
    viewedRouteId && drawerState.type === 'closed' ? resolveConfiguredRoute(viewedRouteId) : undefined;

  // Route IDs are built from the route's content, so a shared link goes stale once the route is
  // edited, and a deleted route has no ID at all. Drop an ID that no longer matches anything, so
  // the URL doesn't keep pointing at a route that isn't there.
  useEffect(() => {
    if (viewedRouteId && routeWithIds && !resolveConfiguredRoute(viewedRouteId)) {
      updateSearchParams({ routeId: undefined, [ALERTMANAGER_QUERY_PARAM]: undefined });
    }
  }, [viewedRouteId, routeWithIds, resolveConfiguredRoute, updateSearchParams]);

  const handleRouteClick = useCallback(
    (route: RouteWithID) => {
      dispatchDrawer({ type: 'close' });
      updateSearchParams({ routeId: route.id, [ALERTMANAGER_QUERY_PARAM]: alertmanagerUID });
    },
    [dispatchDrawer, updateSearchParams, alertmanagerUID]
  );

  const handleEditRoute = useCallback(
    (route: RouteWithID) => {
      const configuredRoute = resolveConfiguredRoute(route.id);
      if (configuredRoute) {
        updateSearchParams({ routeId: undefined, [ALERTMANAGER_QUERY_PARAM]: undefined });
        dispatchDrawer({ type: 'edit', route: configuredRoute });
      }
    },
    [dispatchDrawer, resolveConfiguredRoute, updateSearchParams]
  );

  const handleAddRoute = useCallback(
    (referenceRoute: RouteWithID, position: InsertPosition) => {
      updateSearchParams({ routeId: undefined, [ALERTMANAGER_QUERY_PARAM]: undefined });
      dispatchDrawer({ type: 'add', referenceRouteId: referenceRoute.id, insertPosition: position });
    },
    [dispatchDrawer, updateSearchParams]
  );

  // Closes whichever drawer (view/edit/add) is currently open
  const handleDrawerClose = useCallback(() => {
    updateSearchParams({ routeId: undefined, [ALERTMANAGER_QUERY_PARAM]: undefined });
    dispatchDrawer({ type: 'close' });
    setSelectedReceiverName(null);
  }, [dispatchDrawer, updateSearchParams]);

  // Handle deleting a route (from the RouteCard menu, or the view drawer's Delete button)
  const handleDeleteRoute = useCallback(
    (route: RouteWithID) => {
      const configuredRoute = resolveConfiguredRoute(route.id);
      if (configuredRoute) {
        setRouteToDelete(configuredRoute);
      }
    },
    [resolveConfiguredRoute, setRouteToDelete]
  );

  // Confirm deletion
  const handleConfirmDelete = useCallback(async () => {
    if (routeToDelete) {
      const success = await deleteRoute(routeToDelete.id);
      if (success) {
        setRouteToDelete(null);
        // Close the edit drawer if the deleted route was open in it. The view drawer closes by
        // itself: its route is gone from the tree, so the effect above drops the ID from the URL.
        if (drawerState.type === 'edit' && drawerState.route.id === routeToDelete.id) {
          dispatchDrawer({ type: 'close' });
        }
      }
    }
  }, [routeToDelete, deleteRoute, drawerState, dispatchDrawer, setRouteToDelete]);

  // Check if the route currently open in the view drawer can be deleted (not the root route)
  const canDeleteViewingRoute = viewedRoute !== undefined && viewedRoute.id !== routeWithIds?.id;
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
                focussedRouteID={viewedRoute?.id ?? (drawerState.type === 'edit' ? drawerState.route.id : undefined)}
                {...routeCardActions}
              />
            </div>
          )}
        </ViewState>
      </div>
      {viewedRoute && (
        <RouteViewDrawer
          route={viewedRoute}
          onClose={handleDrawerClose}
          onReceiverClick={handleReceiverClick}
          onEdit={canMutateRoutes ? () => handleEditRoute(viewedRoute) : undefined}
          onDelete={canMutateRoutes && canDeleteViewingRoute ? () => handleDeleteRoute(viewedRoute) : undefined}
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
