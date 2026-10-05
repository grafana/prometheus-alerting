import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Collapse, useStyles2 } from '@grafana/ui';

import { useQueryPreview } from '../hooks/useQueryPreview';

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
  const scene = useQueryPreview(dataSourceUid, expression, collapsible ? 'transparent' : 'default');
  const [isOpen, setIsOpen] = React.useState(!defaultCollapsed);

  const content = <scene.Component model={scene} />;

  if (collapsible) {
    return (
      <Collapse
        label={t('alerting.query-preview.title', 'Query Preview')}
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
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
});
