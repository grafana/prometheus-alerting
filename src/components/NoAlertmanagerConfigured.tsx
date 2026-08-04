import React from 'react';
import { PluginPage } from '@grafana/runtime';
import { EmptyState, LinkButton } from '@grafana/ui';
import { t } from '@grafana/i18n';
import { testIds } from './testIds';

const NEW_DATA_SOURCE_URL = '/connections/datasources/new';

/**
 * Rendered instead of the app when no Alertmanager data sources exist in this Grafana instance.
 * Without one there is nothing any of the pages can query, so we point the user at creating one.
 */
export function NoAlertmanagerConfigured() {
  return (
    <PluginPage>
      <div data-testid={testIds.noAlertmanager.container}>
        <EmptyState
          variant="not-found"
          message={t('alertmanager.none-configured.title', 'No Alertmanager data sources configured')}
        >
          {t(
            'alertmanager.none-configured.body',
            'This app needs at least one Alertmanager data source to show alerts, notification routing and silences.'
          )}
          <br />
          <br />
          <LinkButton href={NEW_DATA_SOURCE_URL} icon="plus">
            {t('alertmanager.none-configured.add-data-source', 'Add Alertmanager data source')}
          </LinkButton>
        </EmptyState>
      </div>
    </PluginPage>
  );
}
