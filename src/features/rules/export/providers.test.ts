import { YamlExportProvider, JsonExportProvider, exportProviders, exportProvidersList } from './providers';

describe('YamlExportProvider', () => {
  it('has correct metadata', () => {
    expect(YamlExportProvider.format).toBe('yaml');
    expect(YamlExportProvider.fileExtension).toBe('yaml');
    expect(YamlExportProvider.mimeType).toBe('text/yaml');
  });

  it('has no formatter', () => {
    expect(YamlExportProvider.formatter).toBeUndefined();
  });
});

describe('JsonExportProvider', () => {
  it('has correct metadata', () => {
    expect(JsonExportProvider.format).toBe('json');
    expect(JsonExportProvider.fileExtension).toBe('json');
    expect(JsonExportProvider.mimeType).toBe('application/json');
  });

  it('formatter pretty-prints valid JSON', () => {
    const raw = '{"a":1}';
    expect(JsonExportProvider.formatter!(raw)).toBe(JSON.stringify({ a: 1 }, null, 2));
  });

  it('formatter returns raw string when JSON is invalid', () => {
    const invalid = 'not json';
    expect(JsonExportProvider.formatter!(invalid)).toBe(invalid);
  });
});

describe('exportProviders', () => {
  it('contains yaml and json keys', () => {
    expect(exportProviders).toHaveProperty('yaml');
    expect(exportProviders).toHaveProperty('json');
  });
});

describe('exportProvidersList', () => {
  it('contains both providers', () => {
    expect(exportProvidersList).toHaveLength(2);
    expect(exportProvidersList.map((p) => p.format)).toEqual(expect.arrayContaining(['yaml', 'json']));
  });
});
