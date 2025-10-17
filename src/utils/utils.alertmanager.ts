import { DataSourceInstanceSettings } from '@grafana/data';
import { ComboboxOption } from '@grafana/ui';
import { AlertManagerDataSourceJsonData } from 'types/datasources';

/**
 * Converts an array of DataSourceInstanceSettings to ComboboxOption array
 * suitable for use with Grafana UI Combobox component.
 *
 * @param dataSources - Array of data source instance settings
 * @returns Array of ComboboxOptions with value set to UID, label set to name, and description set to implementation
 */
export function convertDataSourcesToComboboxOptions(
  dataSources: Array<DataSourceInstanceSettings<AlertManagerDataSourceJsonData>>
): Array<ComboboxOption<string>> {
  return dataSources.map((ds) => ({
    value: ds.uid,
    label: ds.name,
    description: ds.jsonData?.implementation ?? 'prometheus',
  }));
}
