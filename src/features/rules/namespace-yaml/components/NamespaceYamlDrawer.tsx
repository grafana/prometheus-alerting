import { css } from '@emotion/css';
import React from 'react';

import { Trans, t } from '@grafana/i18n';
import { Button, ClipboardButton, CodeEditor, LoadingPlaceholder, Stack } from '@grafana/ui';

import { rulerApi } from '../../../../api/rules/ruler.endpoints';
import { DrawerWithFooter } from '../../../../components/DrawerWithFooter';
import { RulesErrorAlert } from '../../components/RulesErrorAlert';

interface NamespaceYamlDrawerProps {
  dataSourceUid: string;
  namespace: string;
  onClose: () => void;
}

export function NamespaceYamlDrawer({ dataSourceUid, namespace, onClose }: NamespaceYamlDrawerProps) {
  const { data, isLoading, error } = rulerApi.useGetRuleNamespaceYamlQuery({ dataSourceUid, namespace });

  const footer =
    !error && data !== undefined ? (
      <Stack gap={1} justifyContent="flex-end">
        <Button variant="secondary" onClick={onClose}>
          <Trans i18nKey="alerting.common.close">Close</Trans>
        </Button>
        <ClipboardButton icon="copy" getText={() => data}>
          <Trans i18nKey="alerting.namespace-yaml.copy">Copy to clipboard</Trans>
        </ClipboardButton>
      </Stack>
    ) : undefined;

  return (
    <DrawerWithFooter
      title={t('alerting.namespace-yaml.title', 'View namespace YAML')}
      subtitle={t('alerting.namespace-yaml.subtitle', 'Namespace: {{namespace}}', { namespace })}
      onClose={onClose}
      size="md"
      footer={footer}
    >
      {isLoading && <LoadingPlaceholder text={t('alerting.namespace-yaml.loading', 'Loading namespace YAML...')} />}

      {error && (
        <RulesErrorAlert
          error={error}
          title={t('alerting.namespace-yaml.error', 'Failed to load YAML for namespace {{namespace}}', {
            namespace,
          })}
        />
      )}

      {!error && data !== undefined && (
        <Stack direction="column" height="100%" minHeight={0}>
          <Stack flex={1} minHeight={0}>
            <CodeEditor
              width="100%"
              height="100%"
              language="yaml"
              value={data}
              showMiniMap={false}
              showLineNumbers={true}
              readOnly={true}
              monacoOptions={{ scrollBeyondLastLine: false }}
              containerStyles={codeEditorStyles}
            />
          </Stack>
        </Stack>
      )}
    </DrawerWithFooter>
  );
}

const codeEditorStyles = css({
  width: '100%',
  height: '100%',
});
