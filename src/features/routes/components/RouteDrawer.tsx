import { css } from '@emotion/css';
import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Alert, Stack, useStyles2, Text, TextLink, Tab, TabsBar, TabContent } from '@grafana/ui';
import { AlertLabel } from '@grafana/alerting';
import { Route } from '@grafana/external-alertmanager/vanilla';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { KeyValueList } from '../../../components/KeyValueList';
import { Section } from '../../../components/KeyValueList/Section';
import { ROUTES } from '../../../constants';
import { prefixRoute } from '../../../utils/utils.routing';

enum ActiveTab {
  Configuration = 'configuration',
  Instances = 'instances',
}

interface RouteDetailsProps {
  route: Route;
}

function RouteDetails({ route }: RouteDetailsProps) {
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
          <TextLink href={prefixRoute(`${ROUTES.Receivers}/${encodeURIComponent(route.receiver)}`)} inline={true}>
            {route.receiver}
          </TextLink>
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
  route: Route | null;
  onClose: () => void;
}

export function RouteDrawer({ route, onClose }: RouteDrawerProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.Configuration);

  if (!route) {
    return null;
  }

  const getRouteTitle = (route: Route) => {
    if (route.matchers && route.matchers.length > 0) {
      return route.matchers.join(', ');
    }
    if (route.receiver) {
      return route.receiver;
    }
    return t('routes.route-label', 'Route');
  };

  const drawerTabs = (
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
  );

  return (
    <DrawerWithFooter
      title={
        <Stack direction="column" gap={0}>
          <Text variant="bodySmall" color="secondary">
            <Trans i18nKey="routes.detail.title">Route</Trans>
          </Text>
          <Text variant="h2">{getRouteTitle(route)}</Text>
        </Stack>
      }
      onClose={onClose}
      width={400}
      tabs={drawerTabs}
    >
      <TabContent>
        {activeTab === ActiveTab.Configuration && <RouteDetails route={route} />}
        {activeTab === ActiveTab.Instances && (
          <Stack direction="column" gap={2}>
            {/* Placeholder for instances - to be implemented */}
          </Stack>
        )}
      </TabContent>
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
