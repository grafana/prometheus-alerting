import React, { PropsWithChildren } from 'react';
import { Icon, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useToggle } from '@react-hookz/web';

export interface SectionProps extends PropsWithChildren {
  title?: string | React.ReactNode;
}

export function Section({ title, children }: SectionProps) {
  const styles = useStyles2(getStyles);
  const [collapsed, toggleCollapsed] = useToggle(false);

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle} onClick={toggleCollapsed}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          {title &&
            (typeof title === 'string' ? (
              <Text variant="body" color="maxContrast">
                {title}
              </Text>
            ) : (
              <div>{title}</div>
            ))}
          <Icon name={collapsed ? 'angle-down' : 'angle-up'} />
        </Stack>
      </div>
      {collapsed ? null : children}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  section: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
    backgroundColor: theme.colors.background.secondary,
  }),
  sectionTitle: css({
    ':hover': {
      cursor: 'pointer',
    },
    marginBottom: theme.spacing(2),
    paddingBottom: theme.spacing(1),
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
});
