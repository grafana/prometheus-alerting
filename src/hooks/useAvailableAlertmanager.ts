import { useMemo } from 'react';
import { config } from '@grafana/runtime';
import { DataSourceInstanceSettings } from '@grafana/data';

/**
 * Hook to get all available Alertmanager data sources configured in Grafana.
 *
 * @returns Array of DataSourceInstanceSettings for all Alertmanager data sources
 */
export function useAvailableAlertmanagers(): DataSourceInstanceSettings[] {
  const alertmanagers = useMemo(() => {
    return Object.values(config.datasources).filter((ds) => ds.type === 'alertmanager');
  }, []);

  return alertmanagers;
}
