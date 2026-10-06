import React, { PropsWithChildren, ReactNode, useState } from 'react';

import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Button, IconButton, LinkButton, Stack, Text, Toggletip, useStyles2 } from '@grafana/ui';
import type { RulesSourceApplication } from '@grafana/external-rules/ruler';

import { getRulesErrorFeedback } from '../../utils/errorFeedback';

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
  const errorFeedback = error ? getRulesErrorFeedback(error) : undefined;

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
                  aria-label={t('rules.datasource-section.collapse', 'Collapse')}
                  disabled={Boolean(error)}
                />
                {/* Always rendered: with no application (e.g. feature discovery failed) it falls
                    back to the data source's own plugin logo rather than dropping the icon, which
                    would make a failing data source hard to pick out of a list. */}
                <DataSourceIcon application={application} dataSourceUid={uid} />

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
                    title={t('rules.datasource-section.error-title', 'Cannot load rules for this data source')}
                    content={
                      <Text color="error">
                        <span>{errorFeedback?.description}</span>
                      </Text>
                    }
                  >
                    <Button variant="destructive" fill="text" size="sm" icon="exclamation-circle">
                      <Trans i18nKey="rules.datasource-section.error">Error</Trans>
                    </Button>
                  </Toggletip>
                )}

                {configureLink && (
                  <LinkButton variant="secondary" fill="text" size="sm" href={configureLink}>
                    <Trans i18nKey="rules.datasource-section.configure">Configure</Trans>
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
    borderRadius: theme.shape.radius.default,
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
