import { css } from '@emotion/css';
import React, { useMemo, useState } from 'react';
import { parse as parseYaml } from 'yaml';

import { Trans, t } from '@grafana/i18n';
import { Alert, Button, Checkbox, CodeEditor, ConfirmModal, Stack } from '@grafana/ui';

import { getMutationErrorFeedback } from '../../../access-control/mutationErrorFeedback';
import { useAppNotifications } from '../../../hooks/useAppNotifications';
import { useUpdateAlertmanagerConfigYaml } from '../hooks/useAlertmanagerConfigYaml';
import { useConfigurationDraft } from '../hooks/useConfigurationDraft';

interface StoredConfigEditorProps {
  /** The configuration Mimir has stored, as YAML. */
  configuration: string;
  onSaved: () => void;
}

/** Lets somebody replace the whole stored Alertmanager configuration by editing its YAML. */
export function StoredConfigEditor({ configuration, onSaved }: StoredConfigEditorProps) {
  const { updateConfiguration, isUpdating } = useUpdateAlertmanagerConfigYaml();
  const { success: notifySuccess, error: notifyError } = useAppNotifications();

  const { value, setValue, hasChanges, discard } = useConfigurationDraft(configuration);
  const [isConfirmingSave, setIsConfirmingSave] = useState(false);
  // The editor stays read-only until the warning above is acknowledged.
  const [isUnlocked, setIsUnlocked] = useState(false);

  const syntaxError = useMemo(() => getYamlSyntaxError(value), [value]);

  const handleSave = async () => {
    setIsConfirmingSave(false);

    try {
      await updateConfiguration(value);
      notifySuccess(t('app-config.configuration.save-success', 'Alertmanager configuration updated'));
      onSaved();
    } catch (err) {
      const feedback = getMutationErrorFeedback(err, {
        fallbackTitle: t('app-config.configuration.save-error', 'Failed to update the Alertmanager configuration'),
        resource: t('app-config.configuration.resource-label', 'the configuration'),
      });
      notifyError(feedback.title, feedback.description);
    }
  };

  return (
    <Stack direction="column" gap={2}>
      <Alert
        severity="warning"
        title={t('app-config.configuration.source-warning.title', 'Saving replaces the whole configuration')}
      >
        <Trans i18nKey="app-config.configuration.source-warning.body">
          The Alertmanager gets exactly what is in the editor. Anything missing from it, whether a receiver, a route or
          a secret, is removed, and there is no earlier version to go back to.
        </Trans>
      </Alert>

      <CodeEditor
        width="100%"
        height={600}
        language="yaml"
        value={value}
        showLineNumbers
        showMiniMap={false}
        monacoOptions={{ scrollBeyondLastLine: false }}
        containerStyles={codeEditorStyles}
        // Monaco refuses edits while this is set. Saving is gated on the same acknowledgement
        // below, so even an edit that got past the editor could not be written.
        readOnly={!isUnlocked}
        onChange={setValue}
        onSave={setValue}
      />

      {syntaxError && (
        <Alert severity="error" title={t('app-config.configuration.invalid-yaml', 'This is not valid YAML')}>
          {syntaxError}
        </Alert>
      )}

      <Stack direction="row" gap={2} justifyContent="space-between" alignItems="center">
        <Checkbox
          label={t(
            'app-config.configuration.acknowledge',
            'I understand the consequences, I want to edit the configuration'
          )}
          value={isUnlocked}
          onChange={(event) => setIsUnlocked(event.currentTarget.checked)}
        />

        <Stack direction="row" gap={1} justifyContent="flex-end">
          <Button variant="secondary" disabled={!hasChanges || isUpdating} onClick={discard}>
            <Trans i18nKey="app-config.configuration.discard">Discard changes</Trans>
          </Button>
          <Button
            variant="primary"
            disabled={!isUnlocked || !hasChanges || Boolean(syntaxError) || isUpdating}
            onClick={() => setIsConfirmingSave(true)}
          >
            {isUpdating ? (
              <Trans i18nKey="app-config.configuration.saving">Saving...</Trans>
            ) : (
              <Trans i18nKey="app-config.configuration.save">Save configuration</Trans>
            )}
          </Button>
        </Stack>
      </Stack>

      <ConfirmModal
        isOpen={isConfirmingSave}
        title={t('app-config.configuration.confirm-save.title', 'Replace the Alertmanager configuration')}
        body={t(
          'app-config.configuration.confirm-save.body',
          'This replaces the entire stored configuration with what is in the editor. Receivers, routes and secrets that are not in the editor will be gone, and there is nothing to undo it with.'
        )}
        confirmText={t('app-config.configuration.confirm-save.confirm', 'Replace configuration')}
        dismissText={t('common.cancel', 'Cancel')}
        confirmVariant="destructive"
        disabled={isUpdating}
        onConfirm={handleSave}
        onDismiss={() => setIsConfirmingSave(false)}
      />
    </Stack>
  );
}

/** Returns the YAML parse error for a value, or undefined when it parses. */
function getYamlSyntaxError(value: string): string | undefined {
  try {
    parseYaml(value);
    return undefined;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

const codeEditorStyles = css({
  width: '100%',
});
