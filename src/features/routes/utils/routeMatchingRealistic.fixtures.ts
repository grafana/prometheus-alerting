import type { AlertGroup, Route, RouteWithID } from '@grafana/external-alertmanager/vanilla';

import { AlertGroupFactory, GettableAlertFactory } from '../../alerts/mocks/alerts.fakes';
import { attachRouteIds } from '../utils';
import type { RouteMatchingWorkload } from './routeMatchingBenchmark.fixtures';

type Policy = Omit<Route, 'routes'> & { key: string; routes?: Policy[] };
type AlertCase = { labels: Record<string, string>; destinations: string[]; weight?: number };
type Destination = { id: string; receiver: string; groupBy: string[] };

export interface RealisticRouteMatchingWorkload extends RouteMatchingWorkload {
  name: string;
  description: string;
  // Receiver stubs deliberately have no delivery integrations or secrets.
  config: { route: Route; receivers: Array<{ name: string }> };
  destinations: Map<string, Destination>;
  expectedRouteIdsByFingerprint: Map<string, string[]>;
}

const START = '2026-09-16T09:00:00.000Z';
const UPDATED = '2026-09-16T09:05:00.000Z';
const END = '2026-09-16T09:15:00.000Z';

/** Hand-authored routing expectations, not answers computed by the matcher under test. */
export function buildProductPlatformWorkload(alertCount = 3_000): RealisticRouteMatchingWorkload {
  const policy: Policy = {
    key: 'triage',
    receiver: 'platform-triage',
    group_by: ['cluster', 'alertname'],
    group_wait: '30s',
    group_interval: '5m',
    repeat_interval: '4h',
    routes: [
      { key: 'watchdog', receiver: 'deadmans-switch', matchers: ['alertname="Watchdog"'] },
      {
        key: 'audit',
        receiver: 'incident-audit',
        matchers: ['environment="production"', 'severity="critical"'],
        continue: true,
      },
      { key: 'nonprod', receiver: 'nonprod-chat', matchers: ['environment=~"staging|development"'] },
      {
        key: 'commerce',
        receiver: 'commerce-chat',
        matchers: ['team="commerce"'],
        group_by: ['cluster', 'service', 'alertname'],
        routes: [
          {
            key: 'payments',
            receiver: 'payments-oncall',
            matchers: ['service=~"payments-api|checkout-api"', 'severity="critical"'],
          },
          { key: 'commerce-warning', receiver: 'commerce-warnings', matchers: ['severity="warning"'] },
        ],
      },
      {
        key: 'data',
        receiver: 'data-chat',
        matchers: ['team="data"'],
        routes: [
          {
            key: 'database',
            receiver: 'database-oncall',
            matchers: ['service=~"postgres-.*|redis-.*"', 'severity!="info"'],
          },
          { key: 'pipeline', receiver: 'data-oncall', matchers: ['severity="critical"'] },
        ],
      },
      {
        key: 'infrastructure',
        receiver: 'platform-chat',
        matchers: ['namespace=~"kube-system|monitoring|ingress-.*"'],
        routes: [{ key: 'infrastructure-page', receiver: 'platform-oncall', matchers: ['severity="critical"'] }],
      },
    ],
  };
  const cases: AlertCase[] = [
    {
      labels: { alertname: 'Watchdog', namespace: 'monitoring', severity: 'none', environment: 'production' },
      destinations: ['watchdog'],
    },
    {
      labels: {
        alertname: 'HighErrorRate',
        environment: 'production',
        team: 'commerce',
        service: 'checkout-api',
        namespace: 'commerce',
        severity: 'critical',
      },
      destinations: ['audit', 'payments'],
      weight: 8,
    },
    {
      labels: {
        alertname: 'HighLatency',
        environment: 'production',
        team: 'commerce',
        service: 'catalog-api',
        namespace: 'commerce',
        severity: 'warning',
      },
      destinations: ['commerce-warning'],
      weight: 4,
    },
    {
      labels: {
        alertname: 'DeploymentReplicasMismatch',
        environment: 'production',
        team: 'commerce',
        service: 'storefront',
        namespace: 'commerce',
        severity: 'info',
      },
      destinations: ['commerce'],
    },
    {
      labels: {
        alertname: 'PostgresReplicationLag',
        environment: 'production',
        team: 'data',
        service: 'postgres-primary',
        namespace: 'data',
        severity: 'critical',
      },
      destinations: ['audit', 'database'],
      weight: 3,
    },
    {
      labels: {
        alertname: 'RedisMemoryHigh',
        environment: 'production',
        team: 'data',
        service: 'redis-cache',
        namespace: 'data',
        severity: 'warning',
      },
      destinations: ['database'],
      weight: 2,
    },
    {
      labels: {
        alertname: 'KafkaConsumerLag',
        environment: 'production',
        team: 'data',
        service: 'event-consumer',
        namespace: 'data',
        severity: 'critical',
      },
      destinations: ['audit', 'pipeline'],
    },
    {
      labels: {
        alertname: 'BatchJobSlow',
        environment: 'production',
        team: 'data',
        service: 'warehouse-loader',
        namespace: 'data',
        severity: 'info',
      },
      destinations: ['data'],
    },
    {
      labels: { alertname: 'KubeAPIDown', environment: 'production', namespace: 'kube-system', severity: 'critical' },
      destinations: ['audit', 'infrastructure-page'],
      weight: 2,
    },
    {
      labels: {
        alertname: 'PrometheusTargetMissing',
        environment: 'production',
        namespace: 'monitoring',
        severity: 'warning',
      },
      destinations: ['infrastructure'],
    },
    {
      labels: {
        alertname: 'HighErrorRate',
        environment: 'staging',
        team: 'commerce',
        service: 'checkout-api',
        namespace: 'commerce-staging',
        severity: 'critical',
      },
      destinations: ['nonprod'],
    },
    {
      labels: {
        alertname: 'BuildQueueHigh',
        environment: 'development',
        team: 'developer-experience',
        severity: 'warning',
      },
      destinations: ['nonprod'],
    },
    {
      labels: {
        alertname: 'CertificateExpiring',
        environment: 'production',
        team: 'identity',
        service: 'auth-api',
        severity: 'critical',
      },
      destinations: ['audit'],
    },
    {
      labels: { alertname: 'ExternalProbeFailed', service: 'partner-api', severity: 'warning' },
      destinations: ['triage'],
    },
  ];
  return buildWorkload(
    'product-platform',
    'Product teams, staging bypass, audit fan-out, and team/root fallback.',
    1,
    policy,
    cases,
    alertCount
  );
}

const TENANTS = [
  'acme',
  'atlas',
  'aurora',
  'beacon',
  'birch',
  'cedar',
  'cobalt',
  'delta',
  'ember',
  'falcon',
  'fjord',
  'granite',
  'harbor',
  'helix',
  'juniper',
  'kepler',
  'lumen',
  'maple',
  'northstar',
  'orbit',
  'pioneer',
  'quartz',
  'summit',
  'willow',
];

/** Tenant namespace routing with nested severity policies and central on-call fan-out. */
export function buildMultiTenantWorkload(alertCount = 3_000): RealisticRouteMatchingWorkload {
  const policy: Policy = {
    key: 'triage',
    receiver: 'platform-triage',
    group_by: ['cluster', 'alertname'],
    group_wait: '30s',
    group_interval: '5m',
    repeat_interval: '4h',
    routes: [
      { key: 'watchdog', receiver: 'deadmans-switch', matchers: ['alertname="Watchdog"'] },
      {
        key: 'central',
        receiver: 'managed-platform-oncall',
        matchers: ['environment="production"', 'severity="critical"'],
        continue: true,
      },
      { key: 'nonprod', receiver: 'tenant-sandbox-chat', matchers: ['environment!="production"'] },
      {
        key: 'production',
        receiver: 'tenant-triage',
        matchers: ['environment="production"'],
        group_by: ['cluster', 'namespace', 'alertname'],
        routes: TENANTS.map((tenant) => ({
          key: tenant,
          receiver: `${tenant}-triage`,
          matchers: [`namespace=~"${tenant}-[a-z0-9-]+"`],
          routes: [
            { key: `${tenant}-critical`, receiver: `${tenant}-oncall`, matchers: ['severity="critical"'] },
            { key: `${tenant}-warning`, receiver: `${tenant}-chat`, matchers: ['severity="warning"'] },
          ],
        })),
      },
    ],
  };
  const cases: AlertCase[] = TENANTS.flatMap((tenant, index) => {
    const labels = { environment: 'production', namespace: `${tenant}-checkout`, service: 'checkout-api', tenant };
    const traffic = index < 2 ? 6 : 1;
    return [
      {
        labels: { ...labels, alertname: 'KubePodCrashLooping', severity: 'critical' },
        destinations: ['central', `${tenant}-critical`],
        weight: traffic,
      },
      {
        labels: { ...labels, alertname: 'ContainerMemoryWorkingSetHigh', severity: 'warning' },
        destinations: [`${tenant}-warning`],
        weight: traffic * 2,
      },
      { labels: { ...labels, alertname: 'DeploymentRolloutSlow', severity: 'info' }, destinations: [tenant] },
    ];
  });
  cases.push(
    {
      labels: { alertname: 'Watchdog', environment: 'production', namespace: 'monitoring', severity: 'none' },
      destinations: ['watchdog'],
    },
    {
      labels: {
        alertname: 'KubePodCrashLooping',
        environment: 'staging',
        namespace: 'acme-checkout',
        severity: 'critical',
      },
      destinations: ['nonprod'],
    },
    {
      labels: {
        alertname: 'NodeFilesystemSpaceFillingUp',
        environment: 'production',
        namespace: 'kube-system',
        severity: 'warning',
        job: 'node-exporter',
      },
      destinations: ['production'],
    },
    {
      labels: { alertname: 'ExternalProbeFailed', environment: 'production', severity: 'critical' },
      destinations: ['central', 'production'],
    },
    {
      labels: { alertname: 'UnknownWorkload', namespace: 'new-tenant', severity: 'warning' },
      destinations: ['nonprod'],
    }
  );
  return buildWorkload(
    'managed-tenants',
    '24 tenant prefixes, severity escalation, overlapping receivers, unknown namespaces.',
    2,
    policy,
    cases,
    alertCount
  );
}

export function buildIncidentResponseWorkload(alertCount = 3_000): RealisticRouteMatchingWorkload {
  const policy: Policy = {
    key: 'triage',
    receiver: 'sre-triage',
    group_by: ['cluster', 'alertname'],
    group_wait: '10s',
    group_interval: '2m',
    repeat_interval: '1h',
    routes: [
      { key: 'watchdog', receiver: 'deadmans-switch', matchers: ['alertname="Watchdog"'] },
      {
        key: 'security',
        receiver: 'security-audit',
        matchers: ['alertname=~"TLS.*|Certificate.*|Suspicious.*"'],
        continue: true,
      },
      {
        key: 'incident',
        receiver: 'incident-command',
        matchers: ['environment="production"', 'severity="critical"', 'maintenance!="true"'],
        continue: true,
      },
      {
        key: 'stateful',
        receiver: 'stateful-triage',
        matchers: ['team=~"database|messaging"'],
        routes: [
          { key: 'database', receiver: 'database-oncall', matchers: ['alertname=~"Database.*|Postgres.*"'] },
          { key: 'cache', receiver: 'cache-chat', matchers: ['service=~".*(redis|cache).*"'] },
          { key: 'stateful-warning', receiver: 'stateful-chat', matchers: ['severity!="info"'] },
        ],
      },
      {
        key: 'platform',
        receiver: 'platform-chat',
        matchers: ['namespace=~"kube-system|monitoring|ingress-.*"'],
        routes: [{ key: 'platform-page', receiver: 'platform-oncall', matchers: ['severity="critical"'] }],
      },
      { key: 'storage', receiver: 'platform-chat', matchers: ['team="storage"'] },
      {
        key: 'warnings',
        receiver: 'sre-warnings',
        matchers: ['severity="warning"', 'alertname!~"InfoInhibitor|Watchdog"', 'maintenance!="true"'],
      },
    ],
  };
  const cases: AlertCase[] = [
    {
      labels: {
        alertname: 'PostgresConnectionsExhausted',
        environment: 'production',
        team: 'database',
        service: 'postgres-primary',
        namespace: 'data',
        severity: 'critical',
      },
      destinations: ['incident', 'database'],
      weight: 10,
    },
    {
      labels: {
        alertname: 'CacheMissRateHigh',
        environment: 'production',
        team: 'messaging',
        service: 'redis-cache',
        namespace: 'data',
        severity: 'warning',
      },
      destinations: ['cache'],
      weight: 4,
    },
    {
      labels: {
        alertname: 'KafkaConsumerLag',
        environment: 'production',
        team: 'messaging',
        service: 'event-consumer',
        namespace: 'data',
        severity: 'warning',
      },
      destinations: ['stateful-warning'],
      weight: 4,
    },
    {
      labels: {
        alertname: 'KafkaPartitionReassigned',
        environment: 'production',
        team: 'messaging',
        service: 'kafka-broker',
        severity: 'info',
      },
      destinations: ['stateful'],
    },
    {
      labels: {
        alertname: 'TLSCertificateExpiring',
        environment: 'production',
        namespace: 'ingress-public',
        severity: 'critical',
      },
      destinations: ['security', 'incident', 'platform-page'],
      weight: 2,
    },
    {
      labels: {
        alertname: 'CertificateExpiring',
        environment: 'production',
        service: 'partner-proxy',
        severity: 'warning',
      },
      destinations: ['security', 'warnings'],
    },
    {
      labels: {
        alertname: 'PrometheusTargetMissing',
        environment: 'production',
        namespace: 'monitoring',
        severity: 'warning',
      },
      destinations: ['platform'],
      weight: 3,
    },
    {
      labels: {
        alertname: 'PersistentVolumeUsageHigh',
        environment: 'production',
        team: 'storage',
        namespace: 'storage',
        severity: 'warning',
      },
      destinations: ['storage'],
      weight: 2,
    },
    {
      labels: {
        alertname: 'NodeFilesystemSpaceFillingUp',
        environment: 'production',
        severity: 'warning',
        job: 'node-exporter',
      },
      destinations: ['warnings'],
      weight: 2,
    },
    {
      labels: {
        alertname: 'ExternalProbeFailed',
        environment: 'production',
        maintenance: 'true',
        severity: 'critical',
      },
      destinations: ['triage'],
    },
    {
      labels: { alertname: 'InfoInhibitor', environment: 'production', severity: 'warning' },
      destinations: ['triage'],
    },
    { labels: { alertname: 'UnknownWorkload', environment: 'production' }, destinations: ['triage'] },
    { labels: { alertname: 'Watchdog', environment: 'production', severity: 'none' }, destinations: ['watchdog'] },
    {
      labels: {
        alertname: 'SuspiciousLogin',
        environment: 'production',
        severity: 'critical',
        service: 'identity-api',
      },
      destinations: ['security', 'incident'],
    },
  ];
  return buildWorkload(
    'incident-response',
    'Stateful incident skew, broad regexes, maintenance exclusions, and shared receivers.',
    3,
    policy,
    cases,
    alertCount
  );
}

export function buildRealisticRouteMatchingWorkloads(alertCount = 3_000): RealisticRouteMatchingWorkload[] {
  return [
    buildProductPlatformWorkload(alertCount),
    buildMultiTenantWorkload(alertCount),
    buildIncidentResponseWorkload(alertCount),
  ];
}

/** Large managed platform: mixed tenant selectors, nested escalation, and shared audit fan-out. */
export function buildLargePlatformWorkload(policyCount: number, alertCount: number): RealisticRouteMatchingWorkload {
  if (!Number.isSafeInteger(policyCount) || policyCount < 8) {
    throw new RangeError('policyCount must be a safe integer >= 8');
  }
  const routes: Policy[] = [
    { key: 'audit', receiver: 'central-audit', matchers: ['severity="critical"'], continue: true },
    { key: 'nonprod', receiver: 'nonprod-chat', matchers: ['environment=~"staging|development"'] },
  ];
  const cases: AlertCase[] = [
    { labels: { alertname: 'UnownedWorkload', severity: 'warning' }, destinations: ['triage'] },
    {
      labels: { alertname: 'DeploymentReplicasMismatch', environment: 'staging', severity: 'warning' },
      destinations: ['nonprod'],
    },
  ];
  let remaining = policyCount - 3;
  for (let tenant = 0; remaining > 0; tenant++) {
    const key = `tenant-${tenant.toString().padStart(4, '0')}`;
    const children: Policy[] = [];
    const size = Math.min(4, remaining);
    if (size >= 2) {
      children.push({
        key: `${key}-page`,
        receiver: `${key}-oncall`,
        matchers: ['severity="critical"', 'maintenance!="true"'],
      });
    }
    if (size >= 3) {
      children.push({
        key: `${key}-database`,
        receiver: 'database-chat',
        matchers: ['service=~"postgres-.*|redis-.*"', 'severity!="info"'],
      });
    }
    if (size >= 4) {
      children.push({
        key: `${key}-warning`,
        receiver: `${key}-chat`,
        matchers: ['severity="warning"', 'service!~"batch-.*|test-.*"'],
      });
    }
    routes.push({
      key,
      receiver: `${key}-triage`,
      matchers:
        tenant % 3 === 0
          ? [`tenant="${key}"`]
          : tenant % 3 === 1
            ? [`namespace=~"${key}-[a-z0-9-]+"`]
            : [`namespace=~"${key}-(api|workers|data)"`],
      group_by: ['cluster', 'namespace', 'alertname'],
      routes: children,
    });
    const labels = { tenant: key, namespace: `${key}-api`, environment: 'production' };
    const weight = tenant < 3 ? 6 : 1;
    cases.push(
      {
        labels: { ...labels, alertname: 'HighErrorRate', service: 'checkout-api', severity: 'critical' },
        destinations: ['audit', size >= 2 ? `${key}-page` : key],
        weight,
      },
      {
        labels: { ...labels, alertname: 'PostgresReplicationLag', service: 'postgres-primary', severity: 'warning' },
        destinations: [size >= 3 ? `${key}-database` : key],
        weight,
      },
      {
        labels: { ...labels, alertname: 'HighLatency', service: 'checkout-api', severity: 'warning' },
        destinations: [size >= 4 ? `${key}-warning` : key],
        weight,
      },
      {
        labels: { ...labels, alertname: 'BatchJobSlow', service: 'batch-import', severity: 'info' },
        destinations: [key],
      },
      {
        labels: {
          ...labels,
          alertname: 'MaintenanceProbeFailed',
          service: 'checkout-api',
          severity: 'critical',
          maintenance: 'true',
        },
        destinations: ['audit', key],
      }
    );
    remaining -= size;
  }
  return buildWorkload(
    `large-platform-${policyCount}`,
    'Mixed tenant selectors, nested severity/service routing, maintenance exclusions, hot tenants and audit fan-out.',
    4,
    { key: 'triage', receiver: 'platform-triage', group_by: ['cluster', 'alertname'], routes },
    cases,
    alertCount
  );
}

function toConfigRoute({ key, routes, ...route }: Policy): Route {
  return { ...route, ...(routes ? { routes: routes.map(toConfigRoute) } : {}) };
}

function buildWorkload(
  name: string,
  description: string,
  scenario: number,
  policy: Policy,
  cases: AlertCase[],
  alertCount: number
): RealisticRouteMatchingWorkload {
  if (!Number.isSafeInteger(alertCount) || alertCount < 1) {
    throw new RangeError('alertCount must be a positive safe integer');
  }
  const configRoute = toConfigRoute(policy);
  const routeTree = attachRouteIds(configRoute);
  const destinations = new Map<string, Destination>();
  function visit(definition: Policy, route: RouteWithID, receiver: string, groupBy: string[]) {
    receiver = definition.receiver ?? receiver;
    groupBy = definition.group_by ?? groupBy;
    destinations.set(definition.key, { id: route.id, receiver, groupBy });
    for (const [index, child] of (definition.routes ?? []).entries()) {
      const compiledChild = route.routes?.[index];
      if (!compiledChild) {
        throw new Error('Missing fixture route');
      }
      visit(child, compiledChild, receiver, groupBy);
    }
  }
  visit(policy, routeTree, 'default', []);
  // Cover each case first, then repeat heavier incident cases within each traffic cycle.
  const traffic = [...cases, ...cases.flatMap((item) => Array.from({ length: (item.weight ?? 1) - 1 }, () => item))];
  const groups = new Map<string, AlertGroup>();
  const expectedRouteIdsByFingerprint = new Map<string, string[]>();
  for (let index = 0; index < alertCount; index++) {
    const example = traffic[index % traffic.length];
    const job =
      example.labels.job ??
      (example.labels.alertname === 'Watchdog'
        ? 'prometheus'
        : example.labels.alertname === 'ExternalProbeFailed'
          ? 'blackbox-exporter'
          : example.labels.service
            ? 'kubernetes-pods'
            : 'kube-state-metrics');
    const port =
      job === 'node-exporter' ? 9100 : job === 'prometheus' ? 9090 : job === 'blackbox-exporter' ? 9115 : 8080;
    const labels: Record<string, string> = {
      cluster: ['prod-eu-west-1', 'prod-us-east-1', 'prod-ap-southeast-1'][index % 3],
      job,
      ...example.labels,
      instance: `10.${scenario}.${Math.floor(index / 250) % 250}.${(index % 250) + 1}:${port}`,
    };
    if (labels.environment === 'staging' || labels.environment === 'development') {
      labels.cluster = `${labels.environment}-eu-west-1`;
    }
    if (labels.job !== 'node-exporter') {
      labels.pod = `${labels.service ?? job}-7d9c84b6f-${index.toString(36).padStart(5, '0')}`;
    }
    const selected = example.destinations.map((key) => {
      const destination = destinations.get(key);
      if (!destination) {
        throw new Error(`Unknown fixture destination: ${key}`);
      }
      return destination;
    });
    const alert = GettableAlertFactory.build({
      fingerprint: `${scenario.toString(16).padStart(4, '0')}${index.toString(16).padStart(12, '0')}`,
      labels,
      annotations: {
        summary: `${labels.alertname} on ${labels.service ?? labels.instance}`,
        runbook_url: `https://runbooks.example.com/alerts/${labels.alertname}`,
      },
      receivers: [...new Set(selected.map((destination) => destination.receiver))].map((receiver) => ({
        name: receiver,
      })),
      startsAt: START,
      updatedAt: UPDATED,
      endsAt: END,
      status: { state: 'active', silencedBy: [], inhibitedBy: [], mutedBy: [] },
    });
    expectedRouteIdsByFingerprint.set(
      alert.fingerprint,
      selected.map((destination) => destination.id)
    );
    for (const destination of selected) {
      const groupLabels = Object.fromEntries(
        destination.groupBy.filter((label) => labels[label] !== undefined).map((label) => [label, labels[label]])
      );
      const key = JSON.stringify([destination.id, groupLabels]);
      let group = groups.get(key);
      if (!group) {
        group = AlertGroupFactory.build({ receiver: { name: destination.receiver }, alerts: [] });
        group.labels = groupLabels;
        groups.set(key, group);
      }
      group.alerts.push(alert);
    }
  }
  const alertGroups = [...groups.values()];
  const expectedCounts = new Map<string, number>();
  const seen = new Set<string>();
  // Match the API's first-seen order without evaluating any matcher to derive expectations.
  for (const group of alertGroups) {
    for (const alert of group.alerts) {
      if (seen.has(alert.fingerprint)) {
        continue;
      }
      seen.add(alert.fingerprint);
      for (const id of expectedRouteIdsByFingerprint.get(alert.fingerprint) ?? []) {
        expectedCounts.set(id, (expectedCounts.get(id) ?? 0) + 1);
      }
    }
  }
  return {
    name,
    description,
    routeTree,
    alertGroups,
    expectedCounts,
    destinations,
    expectedRouteIdsByFingerprint,
    config: {
      route: configRoute,
      receivers: [...new Set([...destinations.values()].map((destination) => destination.receiver))].map(
        (receiver) => ({ name: receiver })
      ),
    },
    routeCount: destinations.size,
    uniqueAlertCount: alertCount,
    alertOccurrenceCount: alertGroups.reduce((sum, group) => sum + group.alerts.length, 0),
  };
}
