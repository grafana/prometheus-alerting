import { renderHook, waitFor } from '@testing-library/react';

import type { ParsedUserConfiguration } from '@grafana/external-alertmanager/mimir';
import { setDataSourceSrv } from '@grafana/runtime';

import { mockMimirAlertmanagerDs } from '../../../test/fixtures/datasources';
import { setMimirAlertmanagerConfig } from '../../../test/handlers/mimir-alertmanager';
import { createMockDataSourceSrv, setMockGrafanaDataSources } from '../../../test/mocks/grafana-runtime';
import { createTestWrapper } from '../../../test/utils/test-wrapper';
import { useTimeIntervals } from './useTimeIntervals';

describe('useTimeIntervals', () => {
  beforeEach(() => {
    setMockGrafanaDataSources();
    setDataSourceSrv(createMockDataSourceSrv());
  });

  it('returns legacy interval definitions and prefers modern duplicates', async () => {
    const config: ParsedUserConfiguration = {
      template_files: {},
      alertmanager_config: {
        route: { receiver: 'default' },
        receivers: [{ name: 'default' }],
        time_intervals: [
          {
            name: 'business-hours',
            time_intervals: [{ weekdays: ['monday:friday'] }],
          },
        ],
        mute_time_intervals: [
          {
            name: 'business-hours',
            time_intervals: [{ weekdays: ['saturday', 'sunday'] }],
          },
          {
            name: 'legacy-holidays',
            time_intervals: [{ months: ['december'] }],
          },
        ],
      },
    };
    setMimirAlertmanagerConfig(config);

    const { result } = renderHook(() => useTimeIntervals(), {
      wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
    });

    await waitFor(() => {
      expect(result.current.timeIntervals).toEqual([
        {
          name: 'business-hours',
          time_intervals: [{ weekdays: ['monday:friday'] }],
        },
        {
          name: 'legacy-holidays',
          time_intervals: [{ months: ['december'] }],
        },
      ]);
    });
  });
});
