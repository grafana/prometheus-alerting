import { useMemo } from 'react';
import { config } from '@grafana/runtime';
import { AlertmanagerDataSourceSettings } from 'types/datasources';

/**
 * Hook to get all available Alertmanager data sources configured in Grafana.
 *
 * @returns Array of DataSourceInstanceSettings for all Alertmanager data sources
 */
export function useAvailableAlertmanagers(): AlertmanagerDataSourceSettings[] {
  const alertmanagers = useMemo(() => {
    return Object.values(config.datasources).filter((ds) => ds.type === 'alertmanager');
  }, []);

  return alertmanagers;
}
