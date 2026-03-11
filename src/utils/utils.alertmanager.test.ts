import { convertDataSourcesToComboboxOptions } from './utils.alertmanager';
import type { AlertmanagerDataSourceSettings } from 'types/datasources';

function makeDs(overrides: Partial<AlertmanagerDataSourceSettings> = {}): AlertmanagerDataSourceSettings {
  return {
    uid: 'uid-1',
    name: 'My Alertmanager',
    type: 'alertmanager',
    jsonData: {},
    ...overrides,
  } as AlertmanagerDataSourceSettings;
}

describe('convertDataSourcesToComboboxOptions', () => {
  it('maps uid to value and name to label', () => {
    const ds = makeDs({ uid: 'abc', name: 'Prod AM' });
    const result = convertDataSourcesToComboboxOptions([ds]);
    expect(result).toEqual([{ value: 'abc', label: 'Prod AM', description: 'prometheus' }]);
  });

  it('uses implementation from jsonData when present', () => {
    const ds = makeDs({ uid: 'abc', name: 'Mimir', jsonData: { implementation: 'mimir' } });
    const result = convertDataSourcesToComboboxOptions([ds]);
    expect(result[0].description).toBe('mimir');
  });

  it('defaults description to prometheus when jsonData is absent', () => {
    const ds = makeDs({ uid: 'abc', name: 'Test', jsonData: undefined });
    const result = convertDataSourcesToComboboxOptions([ds]);
    expect(result[0].description).toBe('prometheus');
  });

  it('returns empty array for empty input', () => {
    expect(convertDataSourcesToComboboxOptions([])).toEqual([]);
  });

  it('maps multiple data sources', () => {
    const dsList = [
      makeDs({ uid: 'uid-1', name: 'First' }),
      makeDs({ uid: 'uid-2', name: 'Second', jsonData: { implementation: 'mimir' } }),
    ];
    const result = convertDataSourcesToComboboxOptions(dsList);
    expect(result).toHaveLength(2);
    expect(result[1].value).toBe('uid-2');
    expect(result[1].description).toBe('mimir');
  });
});
