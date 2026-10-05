import { ComboboxOption } from '@grafana/ui';
import { AlertmanagerDataSourceSettings } from 'types/datasources';

/**
 * Converts an array of DataSourceInstanceSettings to ComboboxOption array
 * suitable for use with Grafana UI Combobox component.
 *
 * @param dataSources - Array of data source instance settings
 * @returns Array of ComboboxOptions with value set to UID, label set to name, and description set to implementation
 */
export function convertDataSourcesToComboboxOptions(
  dataSources: AlertmanagerDataSourceSettings[]
): Array<ComboboxOption<string>> {
  return dataSources.map((ds) => ({
    value: ds.uid,
    label: ds.name,
    description: ds.jsonData?.implementation ?? 'prometheus',
  }));
}

/**
 * Works out which Alertmanager a `?alertmanager=` value points at, returning its UID.
 *
 * Grafana's redirect sends the UID, but its own alerting pages put the data source name there, so a
 * link someone copied from core still works if we fall back to the name. UIDs win if a name happens
 * to look like another data source's UID.
 */
export function findAlertmanagerUIDForQueryParam(
  value: string | null,
  alertmanagers: AlertmanagerDataSourceSettings[]
): string | undefined {
  if (!value) {
    return undefined;
  }

  const byUID = alertmanagers.find((ds) => ds.uid === value);
  const byName = alertmanagers.find((ds) => ds.name === value);

  return (byUID ?? byName)?.uid;
}
