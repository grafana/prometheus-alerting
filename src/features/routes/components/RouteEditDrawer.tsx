import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Stack, Text } from '@grafana/ui';
import { Route } from '@grafana/external-alertmanager/vanilla';
import { RouteWithID } from '@grafana/external-alertmanager/mimir';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { RouteEditForm } from './RouteEditForm';
import { useUpdateRoute } from '../hooks/useUpdateRoute';
import { useAddRoute } from '../hooks/useAddRoute';
import { emptyRoute, FormAmRoute, InsertPosition } from '../types';

interface RouteEditDrawerProps {
  /** The route to edit, or null to add a new route */
  route: RouteWithID | null;
  onClose: () => void;
  referenceRouteId?: string;
  insertPosition?: InsertPosition;
}

export function RouteEditDrawer({ route, onClose, referenceRouteId, insertPosition = 'child' }: RouteEditDrawerProps) {
  const { updateRoute, isUpdating } = useUpdateRoute();
  const { addRoute, isAdding } = useAddRoute();

  const isAddMode = route === null;

  const getRouteTitle = (route: Route | null) => {
    if (!route) {
      return t('routes.new-route', 'New route');
    }
    if (route.matchers && route.matchers.length > 0) {
      return route.matchers.join(', ');
    }
    if (route.receiver) {
      return route.receiver;
    }
    return t('routes.route-label', 'Route');
  };

  const handleSave = async (values: Partial<FormAmRoute>) => {
    if (isAddMode && referenceRouteId) {
      const success = await addRoute(referenceRouteId, values, insertPosition);
      if (success) {
        onClose();
      }
    } else if (route) {
      const success = await updateRoute(route.id, values);
      if (success) {
        onClose();
      }
    }
  };

  // For add mode, use a blank route as template
  const routeForForm = isAddMode ? ({ ...emptyRoute, id: '' } as RouteWithID) : route;

  return (
    <DrawerWithFooter
      title={
        <Stack direction="column" gap={0}>
          <Text variant="bodySmall" color="secondary">
            {isAddMode ? (
              <Trans i18nKey="routes.drawer.adding">New Route</Trans>
            ) : (
              <Trans i18nKey="routes.drawer.editing">Editing Route</Trans>
            )}
          </Text>
          <Text variant="h2">{getRouteTitle(route)}</Text>
        </Stack>
      }
      onClose={onClose}
      size="md"
    >
      {routeForForm && (
        <RouteEditForm
          route={routeForForm}
          onSubmit={handleSave}
          onCancel={onClose}
          isSubmitting={isUpdating || isAdding}
        />
      )}
    </DrawerWithFooter>
  );
}
