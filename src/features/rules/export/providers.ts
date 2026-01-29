export type ExportFormat = 'yaml' | 'json';

export interface ExportProvider {
  name: string;
  format: ExportFormat;
  fileExtension: string;
  mimeType: string;
  formatter?: (raw: string) => string;
}

export const YamlExportProvider: ExportProvider = {
  name: 'YAML',
  format: 'yaml',
  fileExtension: 'yaml',
  mimeType: 'application/x-yaml',
};

export const JsonExportProvider: ExportProvider = {
  name: 'JSON',
  format: 'json',
  fileExtension: 'json',
  mimeType: 'application/json',
  formatter: (raw: string) => {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  },
};

export const exportProviders: Record<ExportFormat, ExportProvider> = {
  yaml: YamlExportProvider,
  json: JsonExportProvider,
};

export const exportProvidersList = Object.values(exportProviders);
