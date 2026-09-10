import { renderHook, waitFor } from '@testing-library/react';
import { setDataSourceSrv } from '@grafana/runtime';
import { beforeEach, describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

import { AlertingPermission } from '../../../access-control/abilities';
import { PermissionDeniedError, UnsupportedOperationError } from '../../../access-control/errors';
import { mockAlertmanagerDs, mockMimirAlertmanagerDs } from '../../../test/fixtures/datasources';
import {
  getMimirAlertmanagerRawConfig,
  setMimirAlertmanagerRawConfig,
} from '../../../test/handlers/mimir-alertmanager';
import {
  createMockDataSourceSrv,
  setCurrentUserPermissions,
  setMockGrafanaDataSources,
} from '../../../test/mocks/grafana-runtime';
import { createTestWrapper } from '../../../test/utils/test-wrapper';
import { useAlertmanagerConfigYaml, useUpdateAlertmanagerConfigYaml } from './useAlertmanagerConfigYaml';

const storedDocument = `template_files:
    default.tmpl: |
        {{ define "alert.title" }}[{{ .Status }}]{{ end }}
alertmanager_config: |
    # Alerts for the platform team.
    route:
      receiver: default
    receivers:
      - name: default
`;

const storedConfiguration = `# Alerts for the platform team.
route:
  receiver: default
receivers:
  - name: default
`;

describe('useAlertmanagerConfigYaml', () => {
  beforeEach(() => {
    setMockGrafanaDataSources();
    setDataSourceSrv(createMockDataSourceSrv());
    setCurrentUserPermissions(AlertingPermission.NotificationsWrite);
  });

  it('returns the stored configuration with its comments intact', async () => {
    setMimirAlertmanagerRawConfig(storedDocument);

    const { result } = renderHook(() => useAlertmanagerConfigYaml(), {
      wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
    });

    await waitFor(() => expect(result.current.configuration).toBe(storedConfiguration));
  });
});

describe('useUpdateAlertmanagerConfigYaml', () => {
  beforeEach(() => {
    setMockGrafanaDataSources();
    setDataSourceSrv(createMockDataSourceSrv());
    setCurrentUserPermissions(AlertingPermission.NotificationsWrite);
    setMimirAlertmanagerRawConfig(storedDocument);
  });

  it('writes the configuration and leaves the template files alone', async () => {
    const { result } = renderHook(() => useUpdateAlertmanagerConfigYaml(), {
      wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
    });

    await result.current.updateConfiguration('route:\n  receiver: other\nreceivers:\n  - name: other\n');

    const written = parseYaml(getMimirAlertmanagerRawConfig() ?? '');
    expect(written.alertmanager_config).toBe('route:\n  receiver: other\nreceivers:\n  - name: other\n');
    expect(written.template_files).toEqual({
      'default.tmpl': '{{ define "alert.title" }}[{{ .Status }}]{{ end }}\n',
    });
  });

  it('rejects when notification write permission is missing', async () => {
    setCurrentUserPermissions();

    const { result } = renderHook(() => useUpdateAlertmanagerConfigYaml(), {
      wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
    });

    await expect(result.current.updateConfiguration('route:\n  receiver: other\n')).rejects.toThrow(
      PermissionDeniedError
    );
  });

  it('rejects for an Alertmanager without a configuration API', async () => {
    const { result } = renderHook(() => useUpdateAlertmanagerConfigYaml(), {
      wrapper: createTestWrapper(mockAlertmanagerDs.uid),
    });

    await expect(result.current.updateConfiguration('route:\n  receiver: other\n')).rejects.toThrow(
      UnsupportedOperationError
    );
  });

  it('writes to a data source Grafana provisioned read-only, which only locks its own settings', async () => {
    setMockGrafanaDataSources({
      [mockMimirAlertmanagerDs.uid]: { ...mockMimirAlertmanagerDs, readOnly: true },
    });

    const { result } = renderHook(() => useUpdateAlertmanagerConfigYaml(), {
      wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
    });

    await result.current.updateConfiguration('route:\n  receiver: other\nreceivers:\n  - name: other\n');

    const written = parseYaml(getMimirAlertmanagerRawConfig() ?? '');
    expect(written.alertmanager_config).toContain('receiver: other');
  });
});
