import { css } from '@emotion/css';
import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Alert, Button, Stack, useStyles2, Text, Tab, TabsBar, TabContent, TextLink } from '@grafana/ui';
import { AlertLabel } from '@grafana/alerting';
import { Route } from '@grafana/external-alertmanager/vanilla';
import { RouteWithID } from '@grafana/external-alertmanager/mimir';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { KeyValueList } from '../../../components/KeyValueList';
import { Section } from '../../../components/KeyValueList/Section';
import { PolicyEditForm } from './PolicyEditForm';
import { useUpdateRoute } from '../hooks/useUpdateRoute';
import { useAddRoute } from '../hooks/useAddRoute';
import { emptyRoute, FormAmRoute, InsertPosition } from '../types';

enum ActiveTab {
  Configuration = 'configuration',
  Instances = 'instances',
}

export enum DrawerMode {
  View = 'view',
  Edit = 'edit',
  Add = 'add',
}

interface RouteDetailsProps {
  route: Route;
  onReceiverClick?: (receiverName: string) => void;
}

function RouteDetails({ route, onReceiverClick }: RouteDetailsProps) {
  const styles = useStyles2(getStyles);

  const items = [
    ...(route.group_by && route.group_by.length > 0
      ? [{ label: t('routes.group-by-label', 'Group by'), value: route.group_by.join(', ') }]
      : []),
    ...(route.group_wait ? [{ label: t('routes.group-wait-label', 'Group wait'), value: route.group_wait }] : []),
    ...(route.group_interval
      ? [{ label: t('routes.group-interval-label', 'Group interval'), value: route.group_interval }]
      : []),
    ...(route.repeat_interval
      ? [{ label: t('routes.repeat-interval-label', 'Repeat interval'), value: route.repeat_interval }]
      : []),
    ...(route.continue !== undefined
      ? [
          {
            label: t('routes.continue-label', 'Continue'),
            value: route.continue ? t('routes.yes', 'Yes') : t('routes.no', 'No'),
          },
        ]
      : []),
  ];

  return (
    <Stack direction="column" gap={2}>
      {route.matchers && route.matchers.length > 0 && (
        <Section title={t('routes.matchers-label', 'Matchers')}>
          <div className={styles.matchersContainer}>
            {route.matchers.map((matcher: string, index: number) => {
              return <AlertLabel key={index} value={matcher} colorBy="value" size="sm" />;
            })}
          </div>
        </Section>
      )}

      {route.receiver && (
        <Section title={t('routes.receiver-label', 'Receiver')}>
          {onReceiverClick ? (
            <TextLink color="link" onClick={() => onReceiverClick(route.receiver!)} href="#">
              {route.receiver}
            </TextLink>
          ) : (
            <Text>{route.receiver}</Text>
          )}
        </Section>
      )}

      {items.length > 0 && (
        <Section title={t('routes.configuration-label', 'Configuration')}>
          <KeyValueList items={items} />
        </Section>
      )}

      {route.routes && route.routes.length > 0 && (
        <Section title={t('routes.child-routes-label', 'Child Routes')}>
          <Alert title="" severity="info">
            {t('routes.child-routes-count', 'This route has {{count}} child route(s).', { count: route.routes.length })}
          </Alert>
        </Section>
      )}

      {!route.matchers && !route.receiver && !route.group_by && (
        <Alert title={t('routes.root-route-title', 'Root Route')} severity="info">
          <Trans i18nKey="routes.root-route-desc">
            This is the root route. All alerts will be processed through this route and its children.
          </Trans>
        </Alert>
      )}
    </Stack>
  );
}

interface RouteDrawerProps {
  /** The route to view/edit (null for add mode) */
  route: RouteWithID | null;
  onClose: () => void;
  onReceiverClick?: (receiverName: string) => void;
  canEdit?: boolean;
  mode?: DrawerMode;
  referenceRouteId?: string;
  insertPosition?: InsertPosition;
}

export function RouteDrawer({
  route,
  onClose,
  onReceiverClick,
  canEdit = false,
  mode: initialMode = DrawerMode.View,
  referenceRouteId,
  insertPosition = 'child',
}: RouteDrawerProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Configuration);
  const [mode, setMode] = useState<DrawerMode>(initialMode);
  const { updateRoute, isUpdating } = useUpdateRoute();
  const { addRoute, isAdding } = useAddRoute();

  const isAddMode = mode === DrawerMode.Add;
  const isEditMode = mode === DrawerMode.Edit;
  const isViewMode = mode === DrawerMode.View;

  // For add mode, we don't need a route
  if (!route && !isAddMode) {
    return null;
  }

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

  const getDrawerSubtitle = () => {
    if (isAddMode) {
      return <Trans i18nKey="routes.drawer.adding">New Route</Trans>;
    }
    if (isEditMode) {
      return <Trans i18nKey="routes.drawer.editing">Editing Route</Trans>;
    }
    return <Trans i18nKey="routes.detail.title">Route</Trans>;
  };

  const handleEdit = () => {
    setMode(DrawerMode.Edit);
  };

  const handleCancelEdit = () => {
    if (isAddMode) {
      // In add mode, cancel closes the drawer
      onClose();
    } else {
      setMode(DrawerMode.View);
    }
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
        setMode(DrawerMode.View);
      }
    }
  };

  const drawerTabs = isViewMode ? (
    <TabsBar>
      <Tab
        label={t('routes.drawer.tabs.configuration', 'Configuration')}
        active={activeTab === ActiveTab.Configuration}
        onChangeTab={() => setActiveTab(ActiveTab.Configuration)}
      />
      <Tab
        label={t('routes.drawer.tabs.instances', 'Instances')}
        active={activeTab === ActiveTab.Instances}
        onChangeTab={() => setActiveTab(ActiveTab.Instances)}
      />
    </TabsBar>
  ) : undefined;

  const drawerFooter =
    isViewMode && canEdit ? (
      <Button variant="secondary" icon="pen" onClick={handleEdit}>
        <Trans i18nKey="routes.drawer.edit">Edit</Trans>
      </Button>
    ) : undefined;

  // For add mode, use a blank route as template
  const routeForForm = isAddMode ? ({ ...emptyRoute, id: '' } as RouteWithID) : route!;

  return (
    <DrawerWithFooter
      title={
        <Stack direction="column" gap={0}>
          <Text variant="bodySmall" color="secondary">
            {getDrawerSubtitle()}
          </Text>
          <Text variant="h2">{getRouteTitle(route)}</Text>
        </Stack>
      }
      onClose={onClose}
      size={isViewMode ? 'sm' : 'md'}
      tabs={drawerTabs}
      footer={drawerFooter}
    >
      {isViewMode && route ? (
        <TabContent>
          {activeTab === ActiveTab.Configuration && <RouteDetails route={route} onReceiverClick={onReceiverClick} />}
          {activeTab === ActiveTab.Instances && (
            // eslint-disable-next-line @grafana/i18n/no-untranslated-strings
            <>Instances</>
          )}
        </TabContent>
      ) : (
        <PolicyEditForm
          route={routeForForm}
          onSubmit={handleSave}
          onCancel={handleCancelEdit}
          isSubmitting={isUpdating || isAdding}
        />
      )}
    </DrawerWithFooter>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  matchersContainer: css({
    display: 'flex',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
  }),
});
