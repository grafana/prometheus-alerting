import { css } from '@emotion/css';
import React, { useMemo, useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Button, EmptyState, Stack, Text, useStyles2 } from '@grafana/ui';

import type { QueryPreviewResult } from '../hooks/useQueryPreview';

const PAGE_SIZE = 20;

interface QueryPreviewTableProps {
  results: QueryPreviewResult[];
}

export function QueryPreviewTable({ results }: QueryPreviewTableProps) {
  const styles = useStyles2(getStyles);
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const pageStart = page * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, results.length);
  const pageItems = results.slice(pageStart, pageEnd);

  const showPagination = totalPages > 1;

  if (results.length === 0) {
    return (
      <div className={styles.noData}>
        <EmptyState variant="completed" message={t('alerting.query-preview.no-data', 'No data')} />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.results}>
        {pageItems.map((result, index) => (
          <ResultRow key={`${pageStart + index}`} result={result} index={pageStart + index} />
        ))}
      </div>
      {showPagination && (
        <div className={styles.pagination}>
          <Stack alignItems="center" justifyContent="center" gap={1}>
            <Button
              variant="secondary"
              fill="outline"
              size="sm"
              icon="angle-left"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label={t('alerting.query-preview.previous-page', 'Previous page')}
            />
            <Text color="secondary" variant="bodySmall">
              <Trans
                i18nKey="alerting.query-preview.page-counter"
                values={{ start: pageStart + 1, end: pageEnd, total: results.length }}
              >
                {'{{start}}'} - {'{{end}}'} of {'{{total}}'}
              </Trans>
            </Text>
            <Button
              variant="secondary"
              fill="outline"
              size="sm"
              icon="angle-right"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              aria-label={t('alerting.query-preview.next-page', 'Next page')}
            />
          </Stack>
        </div>
      )}
    </div>
  );
}

interface ResultRowProps {
  result: QueryPreviewResult;
  index: number;
}

function ResultRow({ result, index }: ResultRowProps) {
  const styles = useStyles2(getStyles);
  const labels = Object.entries(result.labels);
  const hasLabels = labels.length > 0;

  const formattedLabels = useMemo(() => {
    if (!hasLabels) {
      return `Series ${index}`;
    }
    return labels.map(([key, value]) => `${key}="${value}"`).join(', ');
  }, [hasLabels, labels, index]);

  return (
    <div className={styles.row}>
      <Stack direction="row" gap={1} alignItems="center">
        <div className={styles.labelContainer} title={formattedLabels}>
          <Text variant="code">
            {hasLabels ? (
              <>
                <span>{'{'}</span>
                {labels.map(([key, value], i) => (
                  <span key={key}>
                    <span className={styles.labelKey}>{key}</span>
                    <span>=</span>
                    <span>&quot;</span>
                    <span className={styles.labelValue}>{value}</span>
                    <span>&quot;</span>
                    {i < labels.length - 1 && <span>, </span>}
                  </span>
                ))}
                <span>{'}'}</span>
              </>
            ) : (
              <span className={styles.labelKey}>
                <Trans i18nKey="alerting.query-preview.series-label" values={{ index }}>
                  Series {'{{index}}'}
                </Trans>
              </span>
            )}
          </Text>
        </div>
        <div className={styles.value}>{result.value}</div>
      </Stack>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
    overflow: 'hidden',
  }),
  results: css({
    display: 'flex',
    flexDirection: 'column',
  }),
  row: css({
    padding: `${theme.spacing(0.75)} ${theme.spacing(1)}`,
    '&:nth-child(odd)': {
      backgroundColor: theme.colors.background.secondary,
    },
    '&:hover': {
      backgroundColor: theme.colors.background.canvas,
    },
  }),
  labelContainer: css({
    flex: 1,
    overflowX: 'auto',
    display: 'inline-block',
    whiteSpace: 'nowrap',
  }),
  labelKey: css({
    color: theme.isDark ? '#73bf69' : '#56a64b',
  }),
  labelValue: css({
    color: theme.isDark ? '#ce9178' : '#a31515',
  }),
  value: css({
    textAlign: 'right',
    fontWeight: theme.typography.fontWeightMedium,
  }),
  noData: css({
    padding: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.default,
  }),
  pagination: css({
    borderTop: `1px solid ${theme.colors.border.medium}`,
    padding: theme.spacing(1),
    backgroundColor: theme.colors.background.secondary,
  }),
});
