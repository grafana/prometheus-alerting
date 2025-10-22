import { css } from '@emotion/css';
import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Alert, Stack, useStyles2, Text, TextLink } from '@grafana/ui';
import { AlertLabel } from '@grafana/alerting';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { KeyValueList } from '../../../components/KeyValueList';
import { ROUTES } from '../../../constants';
import { prefixRoute } from '../../../utils/utils.routing';
import type { RouteConfig } from './RouteCard';

interface RouteDetailsProps {
  route: RouteConfig;
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
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <Trans i18nKey="routes.matchers-label">Matchers</Trans>
          </h4>
          <div className={styles.matchersContainer}>
            {route.matchers.map((matcher, index) => {
              const matcherString =
                typeof matcher === 'string'
                  ? matcher
                  : `${matcher.name}${matcher.isRegex ? '=~' : '='}${matcher.value}`;
              return <AlertLabel key={index} value={matcherString} colorBy="value" size="sm" />;
            })}
          </div>
        </div>
      )}

      {route.receiver && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <Trans i18nKey="routes.receiver-label">Receiver</Trans>
          </h4>
          <TextLink href={prefixRoute(`${ROUTES.Receivers}/${encodeURIComponent(route.receiver)}`)} inline={true}>
            {route.receiver}
          </TextLink>
        </div>
      )}

      {items.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <Trans i18nKey="routes.configuration-label">Configuration</Trans>
          </h4>
          <KeyValueList items={items} />
        </div>
      )}

      {route.routes && route.routes.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <Trans i18nKey="routes.child-routes-label">Child Routes</Trans>
          </h4>
          <Alert title="" severity="info">
            {t('routes.child-routes-count', 'This route has {{count}} child route(s).', { count: route.routes.length })}
          </Alert>
        </div>
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
  route: RouteConfig | null;
  onClose: () => void;
}

export function RouteDrawer({ route, onClose }: RouteDrawerProps) {
  if (!route) {
    return null;
  }

  const getRouteTitle = (route: RouteConfig) => {
    if (route.matchers && route.matchers.length > 0) {
      return route.matchers.join(', ');
    }
    if (route.receiver) {
      return route.receiver;
    }
    return t('routes.route-label', 'Route');
  };

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
    >
      <RouteDetails route={route} />
    </DrawerWithFooter>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  section: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
    backgroundColor: theme.colors.background.secondary,
  }),
  sectionTitle: css({
    margin: 0,
    marginBottom: theme.spacing(2),
    fontSize: theme.typography.h5.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    paddingBottom: theme.spacing(1),
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  matchersContainer: css({
    display: 'flex',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
  }),
});
