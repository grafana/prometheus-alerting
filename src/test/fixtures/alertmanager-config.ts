/**
 * Reusable Alertmanager configuration fixtures for testing
 */

import { PostableParsedUserConfiguration } from '@grafana/external-alertmanager/mimir';

/**
 * Minimal configuration - represents a new tenant with no custom configuration
 */
export const emptyConfig: PostableParsedUserConfiguration = {
  template_files: {},
  alertmanager_config: {},
} as PostableParsedUserConfiguration;

/**
 * Basic configuration with a single receiver and route
 */
export const basicConfig: PostableParsedUserConfiguration = {
  template_files: {},
  alertmanager_config: {
    route: {
      receiver: 'default-receiver',
      group_wait: '30s',
      group_interval: '5m',
      repeat_interval: '4h',
    },
    receivers: [{ name: 'default-receiver' }],
    time_intervals: [],
    inhibit_rules: [],
    templates: [],
  },
};

/**
 * Configuration with custom routes and multiple receivers
 */
export const configWithCustomRoutes: PostableParsedUserConfiguration = {
  template_files: {},
  alertmanager_config: {
    route: {
      receiver: 'slack-receiver',
      group_wait: '10s',
      group_interval: '2m',
      repeat_interval: '1h',
      routes: [
        {
          receiver: 'pagerduty-receiver',
          matchers: ['severity=critical'],
        },
        {
          receiver: 'email-receiver',
          matchers: ['team=frontend'],
        },
      ],
    },
    receivers: [{ name: 'slack-receiver' }, { name: 'pagerduty-receiver' }, { name: 'email-receiver' }],
    time_intervals: [
      {
        name: 'weekends',
        time_intervals: [
          {
            weekdays: ['saturday', 'sunday'],
          },
        ],
      },
    ],
    inhibit_rules: [
      {
        source_matchers: ['alertname=HighCPU'],
        target_matchers: ['alertname=LowMemory'],
        equal: ['instance'],
      },
    ],
    templates: ['default.tmpl'],
  },
};

/**
 * Fully populated configuration with all possible fields
 */
export const fullyPopulatedConfig: PostableParsedUserConfiguration = {
  template_files: {
    'custom.tmpl': 'Custom template content',
  },
  alertmanager_config: {
    route: {
      receiver: 'default',
      group_wait: '30s',
      group_interval: '5m',
      repeat_interval: '4h',
    },
    receivers: [{ name: 'default' }],
    time_intervals: [{ name: 'existing', time_intervals: [] }],
    mute_time_intervals: [{ name: 'legacy-mute', time_intervals: [] }],
    inhibit_rules: [
      {
        source_matchers: ['source=true'],
        target_matchers: ['target=true'],
        equal: ['label1'],
      },
    ],
    templates: ['template1.tmpl', 'template2.tmpl'],
  },
};

/**
 * Configuration with multiple inhibit rules for testing index-based CRUD operations
 */
export const configWithInhibitRules: PostableParsedUserConfiguration = {
  template_files: {},
  alertmanager_config: {
    route: {
      receiver: 'default-receiver',
      group_wait: '30s',
      group_interval: '5m',
      repeat_interval: '4h',
    },
    receivers: [{ name: 'default-receiver' }],
    time_intervals: [],
    inhibit_rules: [
      {
        source_matchers: ['severity=critical'],
        target_matchers: ['severity=warning'],
        equal: ['alertname', 'instance'],
      },
      {
        source_matchers: ['team=ops', 'severity=critical'],
        target_matchers: ['team=ops', 'severity=~"warning|info"'],
        equal: ['namespace'],
      },
    ],
    templates: [],
  },
};

/**
 * Configuration for testing route preservation with custom receivers
 */
export const configWithSpecificRoutes: PostableParsedUserConfiguration = {
  template_files: {},
  alertmanager_config: {
    route: {
      receiver: 'custom-receiver',
      group_wait: '15s',
      group_interval: '3m',
      repeat_interval: '2h',
      routes: [
        {
          receiver: 'specific-receiver',
          matchers: ['env=production'],
          continue: true,
        },
      ],
    },
    receivers: [{ name: 'custom-receiver' }, { name: 'specific-receiver' }],
    time_intervals: [],
    inhibit_rules: [],
    templates: [],
  },
};
