import { css } from '@emotion/css';
import React, { ComponentProps, ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Drawer, useStyles2 } from '@grafana/ui';

interface DrawerWithFooterProps extends ComponentProps<typeof Drawer> {
  footer?: ReactNode;
  tabs?: ReactNode;
}

export function DrawerWithFooter({ footer, tabs, children, ...props }: DrawerWithFooterProps) {
  const styles = useStyles2(getStyles);

  return (
    <Drawer {...props} tabs={tabs} scrollableContent={false}>
      <div className={styles.container}>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </Drawer>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
  }),
  body: css({
    flex: 1,
    overflow: 'auto',
    padding: theme.spacing(2),
    minHeight: 0,
  }),
  footer: css({
    borderTop: `1px solid ${theme.colors.border.weak}`,
    padding: theme.spacing(2),
    backgroundColor: theme.colors.background.primary,
    flexShrink: 0,
  }),
});
