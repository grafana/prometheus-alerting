import React from 'react';
import { Trans } from '@grafana/i18n';

export interface RouteConfig {
  receiver?: string;
  group_by?: string[];
  continue?: boolean;
  routes?: RouteConfig[];
  group_wait?: string;
  group_interval?: string;
  repeat_interval?: string;
  matchers?: string[];
}

export interface RouteProperty {
  key: string;
  label: React.ReactNode;
  value: React.ReactNode;
}

export function formatRouteProperties(route: RouteConfig): RouteProperty[] {
  const properties: RouteProperty[] = [];

  if (route.group_by && route.group_by.length > 0) {
    properties.push({
      key: 'group_by',
      label: <Trans i18nKey="routes.group-by-label">Group by:</Trans>,
      value: route.group_by.join(', '),
    });
  }

  if (route.group_wait) {
    properties.push({
      key: 'group_wait',
      label: <Trans i18nKey="routes.group-wait-label">Group wait:</Trans>,
      value: route.group_wait,
    });
  }

  if (route.group_interval) {
    properties.push({
      key: 'group_interval',
      label: <Trans i18nKey="routes.group-interval-label">Group interval:</Trans>,
      value: route.group_interval,
    });
  }

  if (route.repeat_interval) {
    properties.push({
      key: 'repeat_interval',
      label: <Trans i18nKey="routes.repeat-interval-label">Repeat interval:</Trans>,
      value: route.repeat_interval,
    });
  }

  if (route.continue !== undefined) {
    properties.push({
      key: 'continue',
      label: <Trans i18nKey="routes.continue-label">Continue:</Trans>,
      value: route.continue ? <Trans i18nKey="routes.yes">Yes</Trans> : <Trans i18nKey="routes.no">No</Trans>,
    });
  }

  return properties;
}
