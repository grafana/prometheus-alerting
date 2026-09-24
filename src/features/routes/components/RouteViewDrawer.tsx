import { css } from '@emotion/css';
import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Alert, Button, Stack, Text, TextLink, useStyles2 } from '@grafana/ui';
import { AlertLabel } from '@grafana/alerting';
import { normalizeMatchers, Route, RouteWithID, stringifyObjectMatcher } from '@grafana/external-alertmanager/vanilla';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { KeyValueList } from '../../../components/KeyValueList/KeyValueList';
import { Section } from '../../../components/KeyValueList/Section';
import { TimeIntervalLinks } from '../../timeIntervals/components/TimeIntervalLinks';

interface RouteDetailsProps {
  route: Route;
  onReceiverClick?: (receiverName: string) => void;
}

function RouteDetails({ route, onReceiverClick }: RouteDetailsProps) {
  const styles = useStyles2(getStyles);

  const matchers = normalizeMatchers(route);
  const hasMatchers = matchers.length > 0;

  const items: Array<{ label: string; value: string }> = [];

  if (route.group_by && route.group_by.length > 0) {
    items.push({ label: t('routes.group-by-label', 'Group by'), value: route.group_by.join(', ') });
  }
  if (route.group_wait) {
    items.push({ label: t('routes.group-wait-label', 'Group wait'), value: route.group_wait });
  }
  if (route.group_interval) {
    items.push({ label: t('routes.group-interval-label', 'Group interval'), value: route.group_interval });
  }
  if (route.repeat_interval) {
    items.push({ label: t('routes.repeat-interval-label', 'Repeat interval'), value: route.repeat_interval });
  }
  // Only the intervals set on this route itself, like the rest of the drawer
  const timeIntervalItems: Array<{ label: string; value: React.ReactNode }> = [];
  if (route.mute_time_intervals && route.mute_time_intervals.length > 0) {
    timeIntervalItems.push({
      label: t('routes.mute-timings-label', 'Mute timings'),
      value: <TimeIntervalLinks names={route.mute_time_intervals} />,
    });
  }
  if (route.active_time_intervals && route.active_time_intervals.length > 0) {
    timeIntervalItems.push({
      label: t('routes.active-timings-label', 'Active timings'),
      value: <TimeIntervalLinks names={route.active_time_intervals} />,
    });
  }

  if (route.continue !== undefined) {
    items.push({
      label: t('routes.continue-label', 'Continue'),
      value: route.continue ? t('routes.yes', 'Yes') : t('routes.no', 'No'),
    });
  }

  return (
    <Stack direction="column" gap={2}>
      {hasMatchers && (
        <Section title={t('routes.matchers-label', 'Matchers')}>
          <div className={styles.matchersContainer}>
            {matchers.map((matcher, index) => (
              <AlertLabel key={index} value={stringifyObjectMatcher(matcher)} colorBy="value" size="sm" />
            ))}
          </div>
        </Section>
      )}

      {route.receiver && (
        <Section title={t('routes.receiver-label', 'Receiver')}>
          {onReceiverClick ? (
            <TextLink color="link" onClick={() => route.receiver && onReceiverClick(route.receiver)} href="#">
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

      {timeIntervalItems.length > 0 && (
        <Section title={t('routes.time-intervals-label', 'Time intervals')}>
          <KeyValueList items={timeIntervalItems} />
        </Section>
      )}

      {route.routes && route.routes.length > 0 && (
        <Section title={t('routes.child-routes-label', 'Child Routes')}>
          <Alert title="" severity="info">
            {t('routes.child-routes-count', 'This route has {{count}} child route(s).', { count: route.routes.length })}
          </Alert>
        </Section>
      )}

      {!hasMatchers && !route.receiver && !route.group_by && (
        <Alert title={t('routes.root-route-title', 'Root Route')} severity="info">
          <Trans i18nKey="routes.root-route-desc">
            This is the root route. All alerts will be processed through this route and its children.
          </Trans>
        </Alert>
      )}
    </Stack>
  );
}

interface RouteViewDrawerProps {
  route: RouteWithID;
  onClose: () => void;
  onReceiverClick?: (receiverName: string) => void;
  /** Shown as an "Edit" button in the footer when provided */
  onEdit?: () => void;
  /** Shown as a "Delete" button in the footer when provided */
  onDelete?: () => void;
}

export function RouteViewDrawer({ route, onClose, onReceiverClick, onEdit, onDelete }: RouteViewDrawerProps) {
  const getRouteTitle = (route: Route) => {
    if (route.matchers && route.matchers.length > 0) {
      return route.matchers.join(', ');
    }
    if (route.receiver) {
      return route.receiver;
    }
    return t('routes.route-label', 'Route');
  };

  const footer =
    onEdit || onDelete ? (
      <Stack direction="row" gap={2}>
        {onEdit && (
          <Button variant="secondary" icon="pen" onClick={onEdit}>
            <Trans i18nKey="routes.drawer.edit">Edit</Trans>
          </Button>
        )}
        {onDelete && (
          <Button variant="destructive" icon="trash-alt" onClick={onDelete}>
            <Trans i18nKey="routes.drawer.delete">Delete</Trans>
          </Button>
        )}
      </Stack>
    ) : undefined;

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
      size="sm"
      footer={footer}
    >
      <RouteDetails route={route} onReceiverClick={onReceiverClick} />
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
