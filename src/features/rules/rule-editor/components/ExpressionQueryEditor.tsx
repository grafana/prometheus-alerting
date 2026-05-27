import { css } from '@emotion/css';
import React, { useCallback, useMemo } from 'react';
import { useAsync } from '@react-hookz/web';

import { CoreApp, DataSourcePluginContextProvider, GrafanaTheme2 } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { getDataSourceSrv } from '@grafana/runtime';
import { DataQuery } from '@grafana/schema';
import { useStyles2 } from '@grafana/ui';

interface ExpressionQueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  dataSourceUid: string;
}

interface PromLokiQuery extends DataQuery {
  expr?: string;
}

export function ExpressionQueryEditor({ value, onChange, dataSourceUid }: ExpressionQueryEditorProps) {
  const styles = useStyles2(getStyles);

  // Load datasource instance
  const [state] = useAsync(async () => {
    if (!dataSourceUid) {
      throw new Error('No datasource name provided');
    }
    return await getDataSourceSrv().get(dataSourceUid);
  });

  const { error, status, result: dataSource } = state;

  // Create query model from expression string
  const dataQuery = useMemo((): PromLokiQuery => {
    return {
      refId: 'A',
      expr: value,
    };
  }, [value]);

  // Handle query changes from the editor
  const onChangeQuery = useCallback(
    (query: DataQuery) => {
      // Extract expr property (used by Prometheus and Loki)
      const promLokiQuery = query as PromLokiQuery;
      const newExpr = promLokiQuery.expr ?? '';
      onChange(newExpr);
    },
    [onChange]
  );

  // Loading state
  if (status === 'loading') {
    return (
      <div className={styles.placeholder}>
        <Trans i18nKey="alerting.expression-editor.loading">Loading query editor...</Trans>
      </div>
    );
  }

  // Get datasource instance settings
  const dsi = getDataSourceSrv().getInstanceSettings(dataSourceUid);

  // Error state - datasource failed to load or doesn't have QueryEditor
  if (error || !dataSource || !dataSource?.components?.QueryEditor || !dsi) {
    const errorMessage = error?.message || 'Data source plugin does not export a Query Editor component';

    return (
      <div className={styles.error}>
        <Trans i18nKey="alerting.expression-editor.could-not-load-editor">
          Could not load query editor: {{ errorMessage }}
        </Trans>
      </div>
    );
  }

  const QueryEditor = dataSource.components.QueryEditor;

  return (
    <DataSourcePluginContextProvider instanceSettings={dsi}>
      <QueryEditor
        query={dataQuery}
        queries={[dataQuery]}
        app={CoreApp.CloudAlerting}
        onChange={onChangeQuery}
        onRunQuery={() => {}} // No-op for now, could add preview later
        datasource={dataSource}
      />
    </DataSourcePluginContextProvider>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  placeholder: css({
    padding: theme.spacing(2),
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  }),
  error: css({
    padding: theme.spacing(2),
    color: theme.colors.error.text,
    backgroundColor: theme.colors.error.transparent,
    border: `1px solid ${theme.colors.error.border}`,
    borderRadius: theme.shape.radius.default,
  }),
});
