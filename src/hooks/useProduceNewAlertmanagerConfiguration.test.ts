import { renderHook, waitFor, act } from '@testing-library/react';
import { setDataSourceSrv } from '@grafana/runtime';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';

import {
  initialAlertmanagerConfiguration,
  PostableParsedUserConfiguration,
  YamlToParsedUserConfiguration,
} from '@grafana/external-alertmanager/mimir';

import { useProduceNewAlertmanagerConfiguration } from './useProduceNewAlertmanagerConfiguration';
import { addTimeInterval } from '../reducers/alertmanager/timeIntervals';
import { addRouteAction } from '../reducers/alertmanager/routes';
import { attachRouteIds } from '../features/routes/utils';
import { server } from '../test/server';
import { createMockDataSourceSrv, setCurrentUserPermissions } from '../test/mocks/grafana-runtime';
import { createTestWrapper } from '../test/utils/test-wrapper';
import {
  configWithCustomRoutes,
  fullyPopulatedConfig,
  emptyConfig,
  configWithSpecificRoutes,
} from '../test/fixtures/alertmanager-config';
import { AlertingPermission } from '../access-control/abilities';
import { PermissionDeniedError, UnsupportedOperationError } from '../access-control/errors';

const mocks = vi.hoisted(() => ({
  hasConfigurationAPI: true,
}));

// Mock the Alertmanager hook to provide test data source UID
vi.mock('./useAlertmanager', () => ({
  useAlertmanager: () => ({
    uid: 'test-mimir-uid',
    settings: {
      uid: 'test-mimir-uid',
      name: 'Test Mimir',
      type: 'prometheus',
      jsonData: {
        implementation: mocks.hasConfigurationAPI ? 'mimir' : 'prometheus',
      },
    },
  }),
}));

describe('useProduceNewAlertmanagerConfiguration', () => {
  beforeEach(() => {
    mocks.hasConfigurationAPI = true;
    setDataSourceSrv(createMockDataSourceSrv());
    setCurrentUserPermissions(AlertingPermission.NotificationsWrite);
    vi.clearAllMocks();
  });

  it('rejects before fetching configuration when notification write permission is missing', async () => {
    setCurrentUserPermissions();
    const fetchConfiguration = vi.fn(() => HttpResponse.text(''));
    const updateConfiguration = vi.fn(() => HttpResponse.json({ status: 'success' }));
    server.use(
      http.get('/api/datasources/proxy/uid/test-mimir-uid/api/v1/alerts', fetchConfiguration),
      http.post('/api/datasources/proxy/uid/test-mimir-uid/api/v1/alerts', updateConfiguration)
    );

    const { result } = renderHook(() => useProduceNewAlertmanagerConfiguration(), {
      wrapper: createTestWrapper(),
    });
    const [produceNewConfig] = result.current;

    await act(async () => {
      await expect(
        produceNewConfig(addTimeInterval({ interval: { name: 'business-hours', time_intervals: [] } }))
      ).rejects.toBeInstanceOf(PermissionDeniedError);
    });

    expect(fetchConfiguration).not.toHaveBeenCalled();
    expect(updateConfiguration).not.toHaveBeenCalled();
  });

  it('rejects before fetching configuration when the configuration API is unsupported', async () => {
    mocks.hasConfigurationAPI = false;
    const fetchConfiguration = vi.fn(() => HttpResponse.text(''));
    const updateConfiguration = vi.fn(() => HttpResponse.json({ status: 'success' }));
    server.use(
      http.get('/api/datasources/proxy/uid/test-mimir-uid/api/v1/alerts', fetchConfiguration),
      http.post('/api/datasources/proxy/uid/test-mimir-uid/api/v1/alerts', updateConfiguration)
    );

    const { result } = renderHook(() => useProduceNewAlertmanagerConfiguration(), {
      wrapper: createTestWrapper(),
    });
    const [produceNewConfig] = result.current;

    await act(async () => {
      await expect(
        produceNewConfig(addTimeInterval({ interval: { name: 'business-hours', time_intervals: [] } }))
      ).rejects.toBeInstanceOf(UnsupportedOperationError);
    });

    expect(fetchConfiguration).not.toHaveBeenCalled();
    expect(updateConfiguration).not.toHaveBeenCalled();
  });

  it('should preserve existing routes when adding a time interval', async () => {
    // Setup: Create a config with custom routes and existing time intervals
    const existingConfig: PostableParsedUserConfiguration = configWithCustomRoutes;

    // Mock the MSW handlers for this specific test
    server.use(
      http.get('/api/datasources/proxy/uid/test-mimir-uid/api/v1/alerts', () => {
        return HttpResponse.text(YamlToParsedUserConfiguration.encode(existingConfig));
      }),
      http.post('/api/datasources/proxy/uid/test-mimir-uid/api/v1/alerts', async ({ request }) => {
        const yamlBody = await request.text();
        const updatedConfig = YamlToParsedUserConfiguration.decode(yamlBody);

        // Assert: Verify the updated config preserves existing routes
        expect(updatedConfig.alertmanager_config.route).toEqual(existingConfig.alertmanager_config.route);

        // Receivers should be preserved
        expect(updatedConfig.alertmanager_config.receivers).toEqual(existingConfig.alertmanager_config.receivers);

        // Time intervals should include both existing and new
        expect(updatedConfig.alertmanager_config.time_intervals).toHaveLength(2);
        expect(updatedConfig.alertmanager_config.time_intervals).toContainEqual(
          existingConfig.alertmanager_config.time_intervals![0]
        );

        // Inhibit rules should be preserved
        expect(updatedConfig.alertmanager_config.inhibit_rules).toEqual(
          existingConfig.alertmanager_config.inhibit_rules
        );

        // Templates should be preserved
        expect(updatedConfig.alertmanager_config.templates).toEqual(existingConfig.alertmanager_config.templates);

        return HttpResponse.json({ status: 'success' });
      })
    );

    const { result } = renderHook(() => useProduceNewAlertmanagerConfiguration(), {
      wrapper: createTestWrapper(),
    });

    // Act: Add a new time interval
    const newTimeInterval = {
      name: 'business-hours',
      time_intervals: [
        {
          times: [
            {
              start_time: '09:00',
              end_time: '17:00',
            },
          ],
          weekdays: ['monday:friday'],
        },
      ],
    };

    const [produceNewConfig] = result.current;

    await act(async () => {
      await produceNewConfig(addTimeInterval({ interval: newTimeInterval }));
    });

    // Wait for the POST request to complete
    await waitFor(() => {
      expect(result.current[1].isSuccess).toBe(true);
    });
  });

  it('should preserve all existing configuration fields when adding a time interval', async () => {
    // Setup: Create a config with all possible fields populated
    const existingConfig: PostableParsedUserConfiguration = fullyPopulatedConfig;

    server.use(
      http.get('/api/datasources/proxy/uid/test-mimir-uid/api/v1/alerts', () => {
        return HttpResponse.text(YamlToParsedUserConfiguration.encode(existingConfig));
      }),
      http.post('/api/datasources/proxy/uid/test-mimir-uid/api/v1/alerts', async ({ request }) => {
        const yamlBody = await request.text();
        const updatedConfig = YamlToParsedUserConfiguration.decode(yamlBody);

        // Assert: All fields should be preserved
        expect(updatedConfig.template_files).toEqual(existingConfig.template_files);
        expect(updatedConfig.alertmanager_config.route).toEqual(existingConfig.alertmanager_config.route);
        expect(updatedConfig.alertmanager_config.receivers).toEqual(existingConfig.alertmanager_config.receivers);
        expect(updatedConfig.alertmanager_config.inhibit_rules).toEqual(
          existingConfig.alertmanager_config.inhibit_rules
        );
        expect(updatedConfig.alertmanager_config.templates).toEqual(existingConfig.alertmanager_config.templates);
        expect(updatedConfig.alertmanager_config.mute_time_intervals).toEqual(
          existingConfig.alertmanager_config.mute_time_intervals
        );

        return HttpResponse.json({ status: 'success' });
      })
    );

    const { result } = renderHook(() => useProduceNewAlertmanagerConfiguration(), {
      wrapper: createTestWrapper(),
    });
    const [produceNewConfig] = result.current;

    // Act: Add a new time interval
    await act(async () => {
      await produceNewConfig(
        addTimeInterval({
          interval: { name: 'new-interval', time_intervals: [] },
        })
      );
    });

    await waitFor(() => {
      expect(result.current[1].isSuccess).toBe(true);
    });
  });

  it('should use initial configuration values for missing fields in empty config', async () => {
    // Setup: Minimal config (new tenant scenario)
    const existingConfig = emptyConfig;

    server.use(
      http.get('/api/datasources/proxy/uid/test-mimir-uid/api/v1/alerts', () => {
        return HttpResponse.text(YamlToParsedUserConfiguration.encode(existingConfig));
      }),
      http.post('/api/datasources/proxy/uid/test-mimir-uid/api/v1/alerts', async ({ request }) => {
        const yamlBody = await request.text();
        const updatedConfig = YamlToParsedUserConfiguration.decode(yamlBody);

        // Assert: Missing fields should use initial configuration defaults
        expect(updatedConfig.alertmanager_config.route).toEqual(
          initialAlertmanagerConfiguration.alertmanager_config.route
        );

        // Receivers should use default from initialAlertmanagerConfiguration
        expect(updatedConfig.alertmanager_config.receivers).toEqual(
          initialAlertmanagerConfiguration.alertmanager_config.receivers
        );

        // Time interval should be added to the default empty array
        expect(updatedConfig.alertmanager_config.time_intervals).toHaveLength(1);
        expect(updatedConfig.alertmanager_config.time_intervals![0].name).toBe('first-interval');

        return HttpResponse.json({ status: 'success' });
      })
    );

    const { result } = renderHook(() => useProduceNewAlertmanagerConfiguration(), {
      wrapper: createTestWrapper(),
    });
    const [produceNewConfig] = result.current;

    // Act: Add a time interval to an empty config
    await act(async () => {
      await produceNewConfig(
        addTimeInterval({
          interval: { name: 'first-interval', time_intervals: [] },
        })
      );
    });

    await waitFor(() => {
      expect(result.current[1].isSuccess).toBe(true);
    });
  });

  it('should not overwrite existing routes with initial configuration defaults', async () => {
    // Setup: Config with custom routes but empty time_intervals
    const existingConfig: PostableParsedUserConfiguration = configWithSpecificRoutes;

    server.use(
      http.get('/api/datasources/proxy/uid/test-mimir-uid/api/v1/alerts', () => {
        return HttpResponse.text(YamlToParsedUserConfiguration.encode(existingConfig));
      }),
      http.post('/api/datasources/proxy/uid/test-mimir-uid/api/v1/alerts', async ({ request }) => {
        const yamlBody = await request.text();
        const updatedConfig = YamlToParsedUserConfiguration.decode(yamlBody);

        // Assert: Custom routes should NOT be replaced with initial config defaults
        // The route should still be the custom one, not the default 'empty-receiver'
        expect(updatedConfig.alertmanager_config.route).toBeDefined();
        expect(updatedConfig.alertmanager_config.route!.receiver).toBe('custom-receiver');
        expect(updatedConfig.alertmanager_config.route!.group_wait).toBe('15s');
        expect(updatedConfig.alertmanager_config.route!.routes).toHaveLength(1);
        expect(updatedConfig.alertmanager_config.route!.routes![0].receiver).toBe('specific-receiver');

        // Receivers should still be custom, not default
        expect(updatedConfig.alertmanager_config.receivers).toHaveLength(2);
        expect(updatedConfig.alertmanager_config.receivers![0].name).toBe('custom-receiver');

        // Should NOT have the 'empty-receiver' from initial config
        expect(
          updatedConfig.alertmanager_config.receivers!.some((r: { name: string }) => r.name === 'empty-receiver')
        ).toBe(false);

        return HttpResponse.json({ status: 'success' });
      })
    );

    const { result } = renderHook(() => useProduceNewAlertmanagerConfiguration(), {
      wrapper: createTestWrapper(),
    });
    const [produceNewConfig] = result.current;

    // Act: Add a time interval
    await act(async () => {
      await produceNewConfig(
        addTimeInterval({
          interval: { name: 'new-interval', time_intervals: [] },
        })
      );
    });

    await waitFor(() => {
      expect(result.current[1].isSuccess).toBe(true);
    });
  });

  it('should not change route content-hash IDs when the root route omits optional timing fields', async () => {
    // Setup: a root route that (like a freshly reset Mimir tenant) doesn't set group_wait/
    // group_interval/repeat_interval explicitly. If defaultsDeep backfilled those from
    // initialAlertmanagerConfiguration before hashing, the root route's ID here would differ
    // from the ID the UI computed against the raw fetched route, and the reducer would fail to
    // find the reference route.
    const existingConfig: PostableParsedUserConfiguration = {
      template_files: {},
      alertmanager_config: {
        route: {
          receiver: 'empty-default-receiver',
        },
        receivers: [{ name: 'empty-default-receiver' }],
        time_intervals: [],
        inhibit_rules: [],
        templates: [],
      },
    };

    const rootId = attachRouteIds(existingConfig.alertmanager_config.route!).id;

    server.use(
      http.get('/api/datasources/proxy/uid/test-mimir-uid/api/v1/alerts', () => {
        return HttpResponse.text(YamlToParsedUserConfiguration.encode(existingConfig));
      }),
      http.post('/api/datasources/proxy/uid/test-mimir-uid/api/v1/alerts', async ({ request }) => {
        const yamlBody = await request.text();
        const updatedConfig = YamlToParsedUserConfiguration.decode(yamlBody);

        expect(updatedConfig.alertmanager_config.route?.routes).toHaveLength(1);
        expect(updatedConfig.alertmanager_config.route?.routes?.[0].receiver).toBe('empty-default-receiver');

        return HttpResponse.json({ status: 'success' });
      })
    );

    const { result } = renderHook(() => useProduceNewAlertmanagerConfiguration(), {
      wrapper: createTestWrapper(),
    });
    const [produceNewConfig] = result.current;

    await act(async () => {
      await produceNewConfig(
        addRouteAction({
          partialRoute: { receiver: 'empty-default-receiver' },
          referenceRouteIdentifier: rootId,
          insertPosition: 'child',
        })
      );
    });

    await waitFor(() => {
      expect(result.current[1].isSuccess).toBe(true);
    });
  });
});
