import { test as base } from '@grafana/plugin-e2e';
import { randomUUID } from 'node:crypto';
import pluginJson from '../../src/plugin.json';
import {
  deleteMimirAlertmanagerConfig,
  initializeMimirAlertmanagerConfig,
  postMimirAlertmanagerConfig,
} from '../api/alertmanagerConfig';
import { createMimirAlertmanagerDataSource, deleteGrafanaDataSource } from '../api/grafana';
import { AppConfigPage } from '../pages/AppConfigPage';
import { InhibitRulesPage } from '../pages/InhibitRulesPage';
import { ReceiversPage } from '../pages/ReceiversPage';
import { RoutesListPage } from '../pages/RoutesListPage';
import { SilencesPage } from '../pages/SilencesPage';
import { TemplatesPage } from '../pages/TemplatesPage';
import { TimeIntervalsPage } from '../pages/TimeIntervalsPage';

/**
 * Test data source constants shared across every Alertmanager-page spec.
 */
export const VANILLA_ALERTMANAGER_UID = 'test-alertmanager';
export const VANILLA_ALERTMANAGER_NAME = 'Test Alertmanager';

type MimirAlertmanagerFixture = {
  uid: string;
  name: string;
  tenantId: string;
  seedConfig: (config: string) => Promise<void>;
};

type AlertmanagerTestFixture = {
  appConfigPage: AppConfigPage;
  inhibitRulesPage: InhibitRulesPage;
  receiversPage: ReceiversPage;
  routesListPage: RoutesListPage;
  silencesPage: SilencesPage;
  templatesPage: TemplatesPage;
  timeIntervalsPage: TimeIntervalsPage;
  /** A dedicated Mimir tenant and Grafana datasource, isolated for one test. */
  mimirAlertmanager: MimirAlertmanagerFixture;
};

export const test = base.extend<AlertmanagerTestFixture>({
  appConfigPage: async ({ page }, use) => {
    const appConfigPage = new AppConfigPage(page, pluginJson.id);
    await use(appConfigPage);
  },
  inhibitRulesPage: async ({ page }, use) => {
    const inhibitRulesPage = new InhibitRulesPage(page, pluginJson.id);
    await use(inhibitRulesPage);
  },
  receiversPage: async ({ page }, use) => {
    const receiversPage = new ReceiversPage(page, pluginJson.id);
    await use(receiversPage);
  },
  routesListPage: async ({ page }, use) => {
    const routesListPage = new RoutesListPage(page, pluginJson.id);
    await use(routesListPage);
  },
  silencesPage: async ({ page }, use) => {
    const silencesPage = new SilencesPage(page, pluginJson.id);
    await use(silencesPage);
  },
  templatesPage: async ({ page }, use) => {
    const templatesPage = new TemplatesPage(page, pluginJson.id);
    await use(templatesPage);
  },
  timeIntervalsPage: async ({ page }, use) => {
    const timeIntervalsPage = new TimeIntervalsPage(page, pluginJson.id);
    await use(timeIntervalsPage);
  },
  mimirAlertmanager: async ({}, use) => {
    const suffix = randomUUID().replaceAll('-', '');
    const uid = `e2e-am-${suffix}`;
    const tenantId = uid;
    const name = `E2E Mimir ${suffix}`;

    await createMimirAlertmanagerDataSource({ uid, name, tenantId });

    try {
      await initializeMimirAlertmanagerConfig(tenantId);
      await use({
        uid,
        name,
        tenantId,
        seedConfig: (config) => postMimirAlertmanagerConfig(tenantId, config),
      });
    } finally {
      try {
        await deleteMimirAlertmanagerConfig(tenantId);
      } finally {
        await deleteGrafanaDataSource(uid);
      }
    }
  },
});

export { expect } from '@grafana/plugin-e2e';
