import { PostableParsedUserConfiguration } from '@grafana/external-alertmanager/mimir';

export const ERROR_NEWER_CONFIGURATION = 'alerting.notifications.conflict' as const;

/**
 * This is mostly used in very rare scenarios where the user configuration is not yet initialized or
 * was initialized to be completely empty. Mimir does this when it sees a new tenant.
 *
 * The API will reject any updates to the configuration until at least one receiver and route with receiver have been added.
 *
 * Adapted from https://github.com/grafana/mimir/blob/c5a3a726a19472bd1019fb957316008fd988b040/pkg/alertmanager/multitenant.go#L408-L418
 *
 */
export const initialAlertmanagerConfiguration: PostableParsedUserConfiguration = {
  alertmanager_config: {
    route: {
      receiver: 'empty-receiver',
      // these timing options are the hard-coded defaults from
      // https://github.com/prometheus/alertmanager/blob/17c791d747b29719741182e8058616303397a073/dispatch/route.go#L32-L38
      group_wait: '30s',
      group_interval: '5m',
      repeat_interval: '4h',
    },
    receivers: [{
      name: 'empty-receiver',
    }],
    time_intervals: [],
    inhibit_rules: [],
    templates: [],
  },
  template_files: {},
} as const;
