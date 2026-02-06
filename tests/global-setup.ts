import pRetry from 'p-retry';

/**
 * Global setup for Playwright E2E tests
 *
 * This runs once before all tests to ensure:
 * 1. Grafana is ready
 * 2. Prometheus is ready and has loaded rules
 * 3. Rules have been evaluated at least once (so they have health status)
 */

interface PrometheusRule {
  name: string;
  health: string;
  lastEvaluation: string;
}

interface PrometheusGroup {
  name: string;
  rules: PrometheusRule[];
}

interface PrometheusResponse {
  data: {
    groups: PrometheusGroup[];
  };
}

async function checkGrafanaReady(): Promise<void> {
  // Check if Grafana API is responding
  const response = await fetch('http://localhost:3000/api/health');

  if (!response.ok) {
    throw new Error(`Grafana not ready (HTTP ${response.status})`);
  }

  const data = await response.json();

  if (data.database !== 'ok') {
    throw new Error('Grafana database not ready');
  }
}

async function checkPrometheusRules(): Promise<PrometheusResponse> {
  // Query Prometheus rules API
  const response = await fetch('http://localhost:9090/api/v1/rules');

  if (!response.ok) {
    throw new Error(`Prometheus not ready (HTTP ${response.status})`);
  }

  const data = (await response.json()) as PrometheusResponse;

  // Check if we have groups and rules
  if (!data.data?.groups || data.data.groups.length === 0) {
    throw new Error('No rule groups loaded yet');
  }

  // Check if test-group exists and has rules
  const testGroup = data.data.groups.find((g) => g.name === 'test-group');
  if (!testGroup || !testGroup.rules || testGroup.rules.length === 0) {
    throw new Error('test-group not found or empty');
  }

  // Check if rules have been evaluated (health status is not "unknown")
  const allRulesEvaluated = testGroup.rules.every((rule) => {
    const hasHealth = rule.health && rule.health !== 'unknown';
    const hasEvaluation = rule.lastEvaluation && rule.lastEvaluation !== '0001-01-01T00:00:00Z';
    return hasHealth || hasEvaluation;
  });

  if (!allRulesEvaluated) {
    throw new Error('Rules not yet evaluated');
  }

  return data;
}

async function globalSetup() {
  console.log('\n=============================================================');
  console.log('🔄 Global Setup: Waiting for services to be ready');
  console.log('=============================================================');

  try {
    // Step 1: Wait for Grafana
    console.log('  🔄 Waiting for Grafana...');
    await pRetry(checkGrafanaReady, {
      retries: 60,
      minTimeout: 2000,
      maxTimeout: 2000,
      factor: 1,
      onFailedAttempt: (context) => {
        const message = context.error.message || String(context.error);
        console.log(`    ⏳ Attempt ${context.attemptNumber}/60: ${message}`);
      },
    });
    console.log('  ✅ Grafana is ready');

    // Step 2: Wait for Prometheus rules to be evaluated
    console.log('  🔄 Waiting for Prometheus rules to be evaluated...');
    const data = await pRetry(checkPrometheusRules, {
      retries: 60,
      minTimeout: 2000,
      maxTimeout: 2000,
      factor: 1,
      onFailedAttempt: (context) => {
        const message = context.error.message || String(context.error);
        console.log(`    ⏳ Attempt ${context.attemptNumber}/60: ${message}`);
      },
    });

    // Success!
    const testGroup = data.data.groups.find((g) => g.name === 'test-group')!;
    console.log(`  ✅ Prometheus is ready with ${data.data.groups.length} rule groups`);
    console.log(`  ✅ test-group has ${testGroup.rules.length} rules, all evaluated`);
    console.log(`  ✅ Rule health statuses: ${testGroup.rules.map((r) => `${r.name}=${r.health}`).join(', ')}`);
    console.log('=============================================================');
    console.log('✅ Global Setup Complete - Ready to run tests');
    console.log('=============================================================\n');
  } catch (error) {
    // If we get here, we've exhausted all attempts
    console.error('  ❌ ERROR: Services not ready after 2 minutes');
    console.error('  💡 Check that containers are running: docker compose ps');
    console.error('  💡 Check Grafana logs: docker compose logs grafana');
    console.error('  💡 Check Prometheus logs: docker compose logs prometheus');
    throw new Error('Services not ready - see logs above for details');
  }
}

export default globalSetup;
