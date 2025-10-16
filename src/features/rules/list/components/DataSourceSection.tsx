import React, { PropsWithChildren, ReactNode, useState } from 'react';

import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { Button, IconButton, LinkButton, Stack, Text, Toggletip, useStyles2 } from '@grafana/ui';

import { RulesSourceApplication } from '../../../../types/rules';

import { DataSourceIcon } from './DataSourceIcon';

export interface DataSourceSectionProps extends PropsWithChildren {
  uid: string;
  name: string;
  loader?: ReactNode;
  application?: RulesSourceApplication;
  isLoading?: boolean;
  description?: ReactNode;
  error?: unknown;
}

export const DataSourceSection = ({
  uid,
  name,
  application,
  children,
  loader,
  error,
  isLoading = false,
  description = null,
}: DataSourceSectionProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const styles = useStyles2((theme) => getStyles(theme, isCollapsed));

  const configureLink = `/connections/datasources/edit/${String(uid)}`;

  return (
    <section aria-labelledby={`datasource-${String(uid)}-heading`} role="listitem">
      <Stack direction="column" gap={0}>
        <Stack direction="column" gap={0}>
          {isLoading && <div className={styles.loadingBar} />}
          <div className={styles.dataSourceSectionTitle}>
            {loader ?? (
              <Stack alignItems="center">
                <IconButton
                  name={isCollapsed ? 'angle-right' : 'angle-down'}
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  aria-label="Collapse"
                  disabled={Boolean(error)}
                />
                {application && <DataSourceIcon application={application} />}

                <Text variant="body" weight="bold" element="h2" id={`datasource-${String(uid)}-heading`}>
                  {name}
                </Text>
                {description && (
                  <Text color="secondary">
                    {'·'} {description}
                  </Text>
                )}

                <div style={{ flexGrow: 1 }} />

                {Boolean(error) && (
                  <Toggletip
                    title="Cannot load rules for this datasource"
                    content={<Text color="error">{String(error)}</Text>}
                  >
                    <Button variant="destructive" fill="text" size="sm" icon="exclamation-circle">
                      Error
                    </Button>
                  </Toggletip>
                )}

                {configureLink && (
                  <LinkButton variant="secondary" fill="text" size="sm" href={configureLink}>
                    Configure
                  </LinkButton>
                )}
              </Stack>
            )}
          </div>
        </Stack>
        {!isCollapsed && <div className={styles.itemsWrapper}>{children}</div>}
      </Stack>
    </section>
  );
};

const getStyles = (theme: GrafanaTheme2, isCollapsed = false) => ({
  itemsWrapper: css({
    position: 'relative',
  }),
  dataSourceSectionTitle: css({
    background: theme.colors.background.secondary,
    padding: theme.spacing(1, 1.5),
  }),
  loadingBar: css({
    height: 2,
    background: theme.colors.primary.main,
    animation: 'pulse 2s ease-in-out infinite',
    '@keyframes pulse': {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
  }),
});
