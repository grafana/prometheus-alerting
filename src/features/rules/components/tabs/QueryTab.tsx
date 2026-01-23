import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, LinkButton, Stack, Text } from '@grafana/ui';
import { getDataSourceSrv } from '@grafana/runtime';
import { RawQuery } from '@grafana/plugin-ui';
import { Trans } from '@grafana/i18n';
import { promqlGrammar, lokiGrammar } from '../../utils/prismGrammars';
import { createExploreLink } from '../../../../utils/navigation';

interface Props {
  query: string;
  dataSourceUid: string;
}

export function QueryTab({ query, dataSourceUid }: Props) {
  const styles = useStyles2(getStyles);

  // Get datasource type to determine language
  const dsSettings = getDataSourceSrv().getInstanceSettings(dataSourceUid);
  const dataSourceType = dsSettings?.type ?? 'prometheus';

  const language = dataSourceType === 'loki'
    ? { grammar: lokiGrammar, name: 'logql' }
    : { grammar: promqlGrammar, name: 'promql' };

  const exploreLink = createExploreLink(dataSourceUid, query, dataSourceType);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <Stack gap={1} alignItems="center">
          {dsSettings?.meta.info.logos.small && (
            <img src={dsSettings.meta.info.logos.small} alt="" className={styles.dsIcon} />
          )}
          <Text weight="medium">{dsSettings?.name ?? dataSourceUid}</Text>
        </Stack>
        <LinkButton
          size="sm"
          variant="secondary"
          icon="compass"
          href={exploreLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Trans i18nKey="rule-details.query.view-in-explore">View in Explore</Trans>
        </LinkButton>
      </div>
      <pre className={styles.codeBlock}>
        <RawQuery query={query} language={language} />
      </pre>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    flexDirection: 'column',
  }),
  header: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1),
    backgroundColor: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderBottom: 'none',
    borderTopLeftRadius: theme.shape.radius.default,
    borderTopRightRadius: theme.shape.radius.default,
  }),
  dsIcon: css({
    width: '16px',
    height: '16px',
  }),
  codeBlock: css({
    margin: 0,
    padding: theme.spacing(1.5),
    border: `1px solid ${theme.colors.border.medium}`,
    borderTop: 'none',
    borderRadius: `0 0 ${theme.shape.radius.default} ${theme.shape.radius.default}`,
  }),
});
