import { DataSourceInstanceSettings } from '@grafana/data';
import { ComboboxOption } from '@grafana/ui';

/**
 * Converts an array of DataSourceInstanceSettings to ComboboxOption array
 * suitable for use with Grafana UI Combobox component.
 *
 * @param dataSources - Array of data source instance settings
 * @returns Array of ComboboxOptions with value set to UID and label set to name
 */
export function convertDataSourcesToComboboxOptions(
  dataSources: DataSourceInstanceSettings[]
): Array<ComboboxOption<string>> {
  return dataSources.map((ds) => ({
    value: ds.uid,
    label: ds.name,
  }));
}
