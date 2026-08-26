import { stringify as stringifyYaml } from 'yaml';

import {
  TransformedAlertmanagerStatusApiResponseTransform,
  toReadOnlyAlertmanagerConfiguration,
} from './alertmanager.types';

function alertmanagerStatus(original: string) {
  return {
    uptime: '1h',
    cluster: { name: 'test-cluster', status: 'ready', peers: [] },
    versionInfo: {
      version: '0.32.1',
      revision: 'test',
      branch: 'main',
      buildUser: 'test-user',
      buildDate: '2026-01-01',
      goVersion: 'go1.25.0',
    },
    config: {
      original,
    },
  };
}

describe('toReadOnlyAlertmanagerConfiguration', () => {
  it('keeps vanilla configuration separate from the writable Mimir envelope', () => {
    const transformedStatus = TransformedAlertmanagerStatusApiResponseTransform.parse(
      alertmanagerStatus(
        stringifyYaml({
          route: { receiver: 'mattermost' },
          receivers: [
            {
              name: 'mattermost',
              mattermost_configs: [
                {
                  webhook_url: 'https://mattermost.example.com/hooks/test',
                  future_mattermost_setting: true,
                },
              ],
            },
          ],
        })
      )
    );

    expect(toReadOnlyAlertmanagerConfiguration(transformedStatus)).toEqual({
      template_files: {},
      alertmanager_config: {
        route: { receiver: 'mattermost' },
        receivers: [
          {
            name: 'mattermost',
            mattermost_configs: [
              {
                webhook_url: 'https://mattermost.example.com/hooks/test',
                future_mattermost_setting: true,
              },
            ],
          },
        ],
      },
    });
  });
});
