import React from 'react';
import { Outlet } from 'react-router-dom';

import { useAlertmanagerFromURL } from '../hooks/useAlertmanagerFromURL';
import { useAvailableAlertmanagers } from '../hooks/useAvailableAlertmanager';

import { NoAlertmanagerConfigured } from './NoAlertmanagerConfigured';

/**
 * A pathless layout route for pages that can only work against an Alertmanager data source.
 *
 * It's also where `?alertmanager=` gets applied, since every page that cares about it sits under here.
 *
 * Rule pages read from Prometheus / Mimir instead, so they must not be nested under this guard.
 */
export function RequireAlertmanager() {
  const availableAlertmanagers = useAvailableAlertmanagers();
  const isSwitchingAlertmanager = useAlertmanagerFromURL();

  if (availableAlertmanagers.length === 0) {
    return <NoAlertmanagerConfigured />;
  }

  // Only for the moment between reading the URL and the store catching up, so the page doesn't start
  // loading from the Alertmanager it's about to leave.
  if (isSwitchingAlertmanager) {
    return null;
  }

  return <Outlet />;
}
