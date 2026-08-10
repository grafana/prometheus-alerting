import React from 'react';
import { Outlet } from 'react-router-dom';

import { useAvailableAlertmanagers } from '../hooks/useAvailableAlertmanager';

import { NoAlertmanagerConfigured } from './NoAlertmanagerConfigured';

/**
 * A pathless layout route for pages that can only work against an Alertmanager data source.
 *
 * Rule pages read from Prometheus / Mimir instead, so they must not be nested under this guard.
 */
export function RequireAlertmanager() {
  const availableAlertmanagers = useAvailableAlertmanagers();

  if (availableAlertmanagers.length === 0) {
    return <NoAlertmanagerConfigured />;
  }

  return <Outlet />;
}
