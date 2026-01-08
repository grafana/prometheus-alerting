import { css, cx } from '@emotion/css';
import React, { ReactElement } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { InlineSwitch, Stack, useStyles2 } from '@grafana/ui';

export interface RuleEditorSectionProps {
  title: string;
  stepNo: number;
  description?: string | ReactElement;
  fullWidth?: boolean;
  switchMode?: {
    isAdvancedMode: boolean;
    setAdvancedMode: (isAdvanced: boolean) => void;
  };
}

export const RuleEditorSection = ({
  title,
  stepNo,
  children,
  fullWidth = false,
  description,
  switchMode,
}: React.PropsWithChildren<RuleEditorSectionProps>) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.parent}>
      <div className={styles.header}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <div>
            <h3 className={styles.title}>
              {stepNo}. {title}
            </h3>
            {description && <div className={styles.description}>{description}</div>}
          </div>
          {switchMode && (
            <InlineSwitch
              value={switchMode.isAdvancedMode}
              onChange={(event) => {
                switchMode.setAdvancedMode(event.currentTarget.checked);
              }}
              label={t('alerting.rule-editor-section.label-advanced-options', 'Advanced options')}
              showLabel
              transparent
              className={styles.reverse}
            />
          )}
        </Stack>
      </div>
      <div className={cx(styles.content, fullWidth && styles.fullWidth)}>{children}</div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  parent: css({
    paddingBottom: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
  header: css({
    marginBottom: theme.spacing(2),
  }),
  title: css({
    fontSize: theme.typography.h5.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    marginBottom: theme.spacing(0.5),
    margin: 0,
  }),
  description: css({
    marginTop: theme.spacing(0.5),
    display: 'block',
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),
  content: css({
    // Minimal padding, let child components control their own spacing
  }),
  fullWidth: css({
    width: '100%',
  }),
  reverse: css({
    flexDirection: 'row-reverse',
    gap: theme.spacing(1),
  }),
});
