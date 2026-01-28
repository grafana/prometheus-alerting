import { css } from '@emotion/css';
import { saveAs } from 'file-saver';
import React, { useCallback, useMemo } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans } from '@grafana/i18n';
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

  const handleDownload = useCallback(() => {
    const blob = new Blob([serializedRule], {
      type: `${provider.mimeType};charset=utf-8`,
    });
    const filename = generateExportFilename(ruleName, format);
    saveAs(blob, filename);
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
