import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { getDataSourceSrv } from '@grafana/runtime';

interface Props {
  query: string;
  dataSourceUid: string;
}

export function QueryTab({ query, dataSourceUid }: Props) {
  const styles = useStyles2(getStyles);

  // Get datasource type to determine language
  const dsSettings = getDataSourceSrv().getInstanceSettings(dataSourceUid);
  const dataSourceType = dsSettings?.type ?? 'prometheus';

  return (
    <div className={styles.container}>
      <div className={styles.label}>{dataSourceType === 'loki' ? 'LogQL Query' : 'PromQL Query'}</div>
      <pre className={styles.query}>{query}</pre>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    padding: theme.spacing(2),
  }),
  label: css({
    fontSize: theme.typography.h6.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    marginBottom: theme.spacing(1),
  }),
  query: css({
    padding: theme.spacing(2),
    backgroundColor: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.bodySmall.fontSize,
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  }),
});
