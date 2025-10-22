import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Box, Text } from '@grafana/ui';
import { getDataSourceSrv } from '@grafana/runtime';
import { Trans } from '@grafana/i18n';

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
    <Box padding={2}>
      <Box marginBottom={1}>
        <Text variant="h6">
          {dataSourceType === 'loki' ? (
            <Trans i18nKey="rule-details.query.logql">LogQL Query</Trans>
          ) : (
            <Trans i18nKey="rule-details.query.promql">PromQL Query</Trans>
          )}
        </Text>
      </Box>
      <Box padding={2} backgroundColor="secondary" borderStyle="solid" borderColor="weak" borderRadius="default">
        <pre className={styles.queryPre}>{query}</pre>
      </Box>
    </Box>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  queryPre: css({
    fontFamily: theme.typography.fontFamilyMonospace,
    fontSize: theme.typography.bodySmall.fontSize,
    overflowX: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    margin: 0,
  }),
});
