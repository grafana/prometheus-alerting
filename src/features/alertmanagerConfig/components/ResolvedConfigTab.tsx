import React from 'react';

import { Trans, t } from '@grafana/i18n';
import { Alert, CodeEditor, LoadingPlaceholder, Stack } from '@grafana/ui';

import { alertmanagerApi } from '../../../api/alertmanager/alertmanager.endpoints';
import { useAlertmanager } from '../../../hooks/useAlertmanager';
import { extractErrorMessage } from '../../../utils/errors';

/**
 * The configuration as the Alertmanager itself reports it. This is not the stored document: the
 * Alertmanager writes it out again from what it loaded, which fills in every default and replaces
 * secrets with `<secret>`. Useful for checking what is actually in effect, no use for editing.
 */
export function ResolvedConfigTab() {
  const { uid: dataSourceUID } = useAlertmanager();
  const { data: status, isLoading, error } = alertmanagerApi.endpoints.getStatus.useQuery({ dataSourceUID });

  if (isLoading) {
    return <LoadingPlaceholder text={t('app-config.configuration.loading', 'Loading configuration...')} />;
  }

  if (error || !status) {
    return (
      <Alert
        severity="error"
        title={t('app-config.configuration.resolved-error', 'Failed to load the running configuration')}
      >
        {extractErrorMessage(error)}
      </Alert>
    );
  }

  return (
    <Stack direction="column" gap={2}>
      <Alert
        severity="info"
        title={t('app-config.configuration.resolved-note.title', 'This is what the Alertmanager loaded')}
      >
        <Trans i18nKey="app-config.configuration.resolved-note.body">
          The Alertmanager writes this out from the configuration it is running, so every default is filled in and
          secrets are redacted. It is not the document that gets saved. To change the configuration, use the Source tab.
        </Trans>
      </Alert>

      <CodeEditor
        width="100%"
        height={600}
        language="yaml"
        value={status.config.original}
        showLineNumbers
        showMiniMap={false}
        monacoOptions={{ scrollBeyondLastLine: false }}
        readOnly
      />
    </Stack>
  );
}
