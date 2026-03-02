import { css } from '@emotion/css';
import React, { useCallback } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Alert, Button, Collapse, LoadingPlaceholder, Stack, Text, useStyles2 } from '@grafana/ui';

import { useQueryPreview } from '../hooks/useQueryPreview';

import { QueryPreviewTable } from './QueryPreviewTable';

interface QueryPreviewPanelProps {
  dataSourceUid: string;
  expression: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export function QueryPreviewPanel({
  dataSourceUid,
  expression,
  collapsible = false,
  defaultCollapsed = true,
}: QueryPreviewPanelProps) {
  const styles = useStyles2(getStyles);
  const { results, isLoading, error, resultType, hasRun, runQuery } = useQueryPreview(dataSourceUid);
  const [isOpen, setIsOpen] = React.useState(!defaultCollapsed);

  const handleRunQuery = useCallback(() => {
    runQuery(expression);
  }, [runQuery, expression]);

  const content = (
    <div className={styles.content}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" gap={1}>
          <Text variant="h6">
            <Trans i18nKey="alerting.query-preview.title">Query Preview</Trans>
          </Text>
          {resultType && results.length > 0 && (
            <Text color="secondary" variant="bodySmall">
              <Trans i18nKey="alerting.query-preview.result-summary" values={{ resultType, count: results.length }}>
                ({'{{resultType}}'}, {'{{count}}'} results)
              </Trans>
            </Text>
          )}
        </Stack>
        <Button
          variant="secondary"
          size="sm"
          icon={isLoading ? 'spinner' : 'play'}
          onClick={handleRunQuery}
          disabled={isLoading || !expression.trim()}
        >
          <Trans i18nKey="alerting.query-preview.run-query">Run query</Trans>
        </Button>
      </Stack>

      {isLoading && (
        <div className={styles.loading}>
          <LoadingPlaceholder text={t('alerting.query-preview.loading', 'Running query...')} />
        </div>
      )}

      {error && !isLoading && (
        <Alert severity="error" title={t('alerting.query-preview.error-title', 'Query failed')}>
          {error}
        </Alert>
      )}

      {!isLoading && !error && hasRun && <QueryPreviewTable results={results} />}
    </div>
  );

  if (collapsible) {
    return (
      <Collapse
        label={t('alerting.query-preview.title', 'Query Preview')}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        collapsible
      >
        {content}
      </Collapse>
    );
  }

  return <div className={styles.wrapper}>{content}</div>;
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    marginTop: theme.spacing(2),
  }),
  content: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  }),
  loading: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(2),
  }),
});
