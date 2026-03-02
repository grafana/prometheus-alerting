import { css } from '@emotion/css';
import { fileSave } from 'browser-fs-access';
import React, { useCallback, useMemo } from 'react';

import { AppEvents, GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { getAppEvents } from '@grafana/runtime';
import { Button, ClipboardButton, CodeEditor, Stack, useStyles2 } from '@grafana/ui';

import type { RulerRuleDTO } from '@grafana/external-rules/vanilla';

import { ExportFormat, exportProviders } from '../providers';
import { generateExportFilename, serializeRule } from '../serialize';

interface RuleExportPreviewProps {
  rule: RulerRuleDTO;
  ruleName: string;
  format: ExportFormat;
  onClose: () => void;
}

export function RuleExportPreview({ rule, ruleName, format, onClose }: RuleExportPreviewProps) {
  const styles = useStyles2(getStyles);
  const provider = exportProviders[format];

  const serializedRule = useMemo(() => {
    const raw = serializeRule(rule, format);
    return provider.formatter ? provider.formatter(raw) : raw;
  }, [rule, format, provider]);

  const handleDownload = useCallback(async () => {
    const blob = new Blob([serializedRule], {
      type: provider.mimeType,
    });
    const filename = `${generateExportFilename(ruleName)}.${format}`;

    try {
      await fileSave(blob, {
        fileName: filename,
        extensions: [`.${format}`],
      });
    } catch (error) {
      // User cancelled the save dialog - this is expected, no action needed
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      // Show error toast to user
      getAppEvents().publish({
        type: AppEvents.alertError.name,
        payload: [t('alerting.export.download-failed', 'Download failed')],
      });
    }
  }, [serializedRule, ruleName, format, provider.mimeType]);

  return (
    <div className={styles.container}>
      <div className={styles.editorContainer}>
        <CodeEditor
          width="100%"
          height="400px"
          language={format}
          value={serializedRule}
          showMiniMap={false}
          showLineNumbers={true}
          readOnly={true}
          monacoOptions={{
            scrollBeyondLastLine: false,
          }}
        />
      </div>
      <Stack gap={1} justifyContent="flex-end">
        <Button variant="secondary" onClick={onClose}>
          <Trans i18nKey="alerting.common.cancel">Cancel</Trans>
        </Button>
        <ClipboardButton icon="copy" getText={() => serializedRule}>
          <Trans i18nKey="alerting.export.copy-code">Copy code</Trans>
        </ClipboardButton>
        <Button icon="download-alt" onClick={handleDownload}>
          <Trans i18nKey="alerting.export.download">Download</Trans>
        </Button>
      </Stack>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: theme.spacing(2),
    paddingTop: theme.spacing(2),
  }),
  editorContainer: css({
    flex: 1,
    minHeight: 0,
  }),
});
