import React, { ReactNode } from 'react';

import { css } from '@emotion/css';
import pluralize from 'pluralize';

import { AlertLabels, StateIcon } from '@grafana/alerting/unstable';
import { GrafanaTheme2 } from '@grafana/data';
import { Trans } from '@grafana/i18n';
import { Icon, Stack, Text, TextLink, Tooltip, useStyles2 } from '@grafana/ui';
import type { RulesSourceApplication } from '@grafana/external-rules/ruler';

import { normalizeHealth, normalizeState } from '../../../../types/rules';
import { labelsSize } from '../../../../utils/labels';

import { ListItem } from './ListItem';
import { MetaText } from './MetaText';
import { RuleLocation } from './RuleLocation';

export interface RuleListItemCommonProps {
  name: string;
  rulesSource: { uid: string; name: string };
  application?: RulesSourceApplication;
  group: string;
  groupUrl?: string;
  namespace: string;
  href?: string;
  health?: string;
  error?: string;
  labels?: Record<string, string>;
  showLocation?: boolean;
  actions?: ReactNode;
}

interface AlertRuleListItemProps extends RuleListItemCommonProps {
  summary?: string;
  state?: string;
  instancesCount?: number;
}

export function AlertRuleListItem({
  name,
  href,
  state,
  health,
  error,
  summary,
  instancesCount,
  showLocation,
  namespace,
  group,
  groupUrl,
  rulesSource,
  application,
  labels,
  actions,
}: AlertRuleListItemProps) {
  const normalizedState = normalizeState(state);
  const normalizedHealth = normalizeHealth(health);

  const metadata: ReactNode[] = [];

  // Add location if needed
  if (showLocation && namespace && group) {
    metadata.push(
      <Text color="secondary" variant="bodySmall" key="location">
        <RuleLocation
          namespace={namespace}
          group={group}
          groupUrl={groupUrl}
          rulesSource={rulesSource}
          application={application}
        />
      </Text>
    );
  }

  // Add instance count
  if (instancesCount !== undefined && instancesCount > 0) {
    metadata.push(
      <MetaText icon="layers-alt" key="instances">
        <Text color="primary" variant="bodySmall">
          {pluralize('instance', instancesCount, true)}
        </Text>
      </MetaText>
    );
  }

  // Add labels
  if (labels && labelsSize(labels) > 0) {
    metadata.push(
      <MetaText icon="tag-alt" key="labels">
        <RuleLabels labels={labels} />
      </MetaText>
    );
  }

  const title = (
    <Stack direction="row" alignItems="center">
      {href ? (
        <TextLink href={href} color="primary" inline={false}>
          {name}
        </TextLink>
      ) : (
        <Text variant="body" weight="medium">
          {name}
        </Text>
      )}
    </Stack>
  );

  const description = (
    <>
      {summary && (
        <Text variant="bodySmall" color="secondary">
          {summary}
        </Text>
      )}
      {error && (
        <Text variant="bodySmall" color="error">
          <Trans i18nKey="rules.list-item.error">Error:</Trans> {error}
        </Text>
      )}
    </>
  );

  return (
    <ListItem
      icon={<StateIcon type="alerting" state={normalizedState} health={normalizedHealth} />}
      title={title}
      description={description}
      meta={metadata}
      actions={actions}
    />
  );
}

interface RecordingRuleListItemProps extends RuleListItemCommonProps {}

export function RecordingRuleListItem({
  name,
  href,
  health,
  error,
  showLocation,
  namespace,
  group,
  groupUrl,
  rulesSource,
  application,
  actions,
}: RecordingRuleListItemProps) {
  const normalizedHealth = normalizeHealth(health);

  const metadata: ReactNode[] = [];

  // Add location if needed
  if (showLocation && namespace && group) {
    metadata.push(
      <Text color="secondary" variant="bodySmall" key="location">
        <RuleLocation
          namespace={namespace}
          group={group}
          groupUrl={groupUrl}
          rulesSource={rulesSource}
          application={application}
        />
      </Text>
    );
  }

  const title = (
    <Stack direction="row" alignItems="center">
      {href ? (
        <TextLink href={href} color="primary" inline={false}>
          {name}
        </TextLink>
      ) : (
        <Text variant="body" weight="medium">
          {name}
        </Text>
      )}
    </Stack>
  );

  const description = error ? (
    <Text variant="bodySmall" color="error">
      <Trans i18nKey="rules.list-item.error">Error:</Trans> {error}
    </Text>
  ) : undefined;

  return (
    <ListItem
      icon={<StateIcon type="recording" health={normalizedHealth} />}
      title={title}
      description={description}
      meta={metadata}
      actions={actions}
    />
  );
}

interface UnknownRuleListItemProps {
  ruleName: string;
  ruleDefinition: unknown;
}

export function UnknownRuleListItem({ ruleName }: UnknownRuleListItemProps) {
  const title = (
    <Stack direction="row" alignItems="center" gap={1}>
      <Text variant="body" weight="medium">
        {ruleName}
      </Text>
      <Text variant="bodySmall" color="warning">
        <Trans i18nKey="rules.list-item.unknown-type">(Unknown rule type)</Trans>
      </Text>
    </Stack>
  );

  return <ListItem icon={<Icon name="question-circle" />} title={title} />;
}

function RuleLabels({ labels }: { labels: Record<string, string> }) {
  const styles = useStyles2(getRuleLabelsStyles);

  return (
    <Tooltip
      content={
        <div className={styles.tooltip}>
          <AlertLabels labels={labels} size="sm" />
        </div>
      }
      placement="right"
      interactive
    >
      <div>
        <Text variant="bodySmall" color="primary">
          {pluralize('label', labelsSize(labels), true)}
        </Text>
      </div>
    </Tooltip>
  );
}

const getRuleLabelsStyles = (theme: GrafanaTheme2) => ({
  tooltip: css({
    padding: theme.spacing(1),
  }),
});
