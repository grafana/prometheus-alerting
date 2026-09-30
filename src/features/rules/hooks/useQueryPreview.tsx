import React, { useMemo } from 'react';

import { CoreApp } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Text } from '@grafana/ui';
import {
  EmbeddedScene,
  PanelBuilders,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneReactObject,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  type DataRequestEnricher,
} from '@grafana/scenes';

class QueryPreviewScene extends EmbeddedScene implements DataRequestEnricher {
  enrichDataRequest() {
    return { app: CoreApp.UnifiedAlerting };
  }
}

export function useQueryPreview(
  dataSourceUid: string,
  expression: string,
  displayMode: 'default' | 'transparent' = 'default'
) {
  return useMemo(() => {
    const runner = new SceneQueryRunner({
      datasource: { uid: dataSourceUid },
      queries: expression.trim()
        ? [{ refId: 'A', expr: expression, instant: false, range: true, queryType: 'range' }]
        : [],
      maxDataPointsFromWidth: true,
    });
    const timeRange = new SceneTimeRange({ from: 'now-1h', to: 'now' });
    const scene = new QueryPreviewScene({
      $data: runner,
      $timeRange: timeRange,
      controls: [
        ...(displayMode === 'default'
          ? [
              new SceneReactObject({
                reactNode: <Text variant="h6">{t('alerting.query-preview.title', 'Query Preview')}</Text>,
              }),
            ]
          : []),
        new SceneControlsSpacer(),
        new SceneTimePicker({}),
        new SceneRefreshPicker({}),
      ],
      body: new SceneFlexLayout({
        children: [
          new SceneFlexItem({ height: 300, body: PanelBuilders.timeseries().setDisplayMode(displayMode).build() }),
        ],
      }),
    });

    return scene;
  }, [dataSourceUid, expression, displayMode]);
}
