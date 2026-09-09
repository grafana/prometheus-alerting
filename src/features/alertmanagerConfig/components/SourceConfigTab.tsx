import React from 'react';

import { t } from '@grafana/i18n';
import { Alert, CodeEditor, LoadingPlaceholder, Stack } from '@grafana/ui';

import { Ability } from '../../../access-control/abilities';
import { MutationDenied } from '../../../access-control/components/MutationDenied';
import { useAlertmanagerConfigMutationAbility } from '../../../hooks/useAlertmanagerConfigMutationAbility';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';
import { extractErrorMessage } from '../../../utils/errors';
import { useAlertmanagerConfigYaml } from '../hooks/useAlertmanagerConfigYaml';
import { StoredConfigEditor } from './StoredConfigEditor';

/**
 * The configuration document the Alertmanager has stored, editable where it can be written.
 *
 * Only Mimir has an API to read and write it, so for a vanilla Alertmanager there is nothing to
 * show here at all and we say so rather than rendering an empty editor.
 */
export function SourceConfigTab() {
  const hasConfigurationAPI = useHasConfigurationAPI();
  const mutationAbility = useAlertmanagerConfigMutationAbility();

  // Checked separately from the ability, which reports a missing permission before a missing API.
  // Without the API there is no document to read either, so the query must not be attempted.
  if (!hasConfigurationAPI) {
    return (
      <MutationDenied
        ability={{ granted: false, cause: 'NOT_SUPPORTED' }}
        resource={t('app-config.configuration.resource-label', 'the configuration')}
      />
    );
  }

  return <StoredConfiguration mutationAbility={mutationAbility} />;
}

function StoredConfiguration({ mutationAbility }: { mutationAbility: Ability }) {
  const { configuration, isLoading, error, refetch } = useAlertmanagerConfigYaml();

  if (isLoading) {
    return <LoadingPlaceholder text={t('app-config.configuration.loading', 'Loading configuration...')} />;
  }

  if (error) {
    return (
      <Alert
        severity="error"
        title={t('app-config.configuration.load-error', 'Failed to load the Alertmanager configuration')}
      >
        {extractErrorMessage(error)}
      </Alert>
    );
  }

  // Type narrowing rather than a state anybody should reach: the query always runs with arguments,
  // so it reports isLoading or an error until it has a document, and an empty one is read back as a
  // starter configuration. Keep showing the loading text rather than a blank tab if it ever does.
  if (configuration === undefined) {
    return <LoadingPlaceholder text={t('app-config.configuration.loading', 'Loading configuration...')} />;
  }

  if (!mutationAbility.granted) {
    return (
      <Stack direction="column" gap={2}>
        <MutationDenied
          ability={mutationAbility}
          resource={t('app-config.configuration.resource-label', 'the configuration')}
        />
        <CodeEditor
          width="100%"
          height={600}
          language="yaml"
          value={configuration}
          showLineNumbers
          showMiniMap={false}
          monacoOptions={{ scrollBeyondLastLine: false }}
          readOnly
        />
      </Stack>
    );
  }

  return <StoredConfigEditor configuration={configuration} onSaved={refetch} />;
}
