import React from 'react';

import { t } from '@grafana/i18n';
import { AlertLabel } from '@grafana/alerting';
import { isTruthy } from '@grafana/data';
import { LinkButton, Stack, TextLink } from '@grafana/ui';
import type { GettableAlert } from '@grafana/external-alertmanager/vanilla';

import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { KeyValueList } from '../../../components/KeyValueList/KeyValueList';
import { Section } from '../../../components/KeyValueList/Section';
import { isAbilityAllowed } from '../../../access-control/abilities';
import { getSilencesAbilities, SilenceAction } from '../../../access-control/abilities.silences';
import { silences as silencesNav } from '../../../utils/navigation';
import { AlertStateBadge } from './AlertStateBadge';

interface AlertDrawerProps {
  alert: GettableAlert;
  onClose: () => void;
}

interface DetailItem {
  label: string;
  value: React.ReactNode;
}

export function AlertDrawer({ alert, onClose }: AlertDrawerProps) {
  const silenceAbilities = getSilencesAbilities();
  const canViewSilences = isAbilityAllowed(silenceAbilities[SilenceAction.ViewSilences]);
  const canMutateSilences = isAbilityAllowed(silenceAbilities[SilenceAction.MutateSilences]);

  const isSilenced = alert.status.silencedBy.length > 0;

  const labelItems = Object.entries(alert.labels).map(([key, value]) => ({
    label: key,
    value: <AlertLabel value={`${key}=${value}`} colorBy="value" size="sm" />,
  }));

  const annotationItems = Object.entries(alert.annotations).map(([key, value]) => ({
    label: key,
    value,
  }));

  const timingItems = [
    { label: t('alerts.drawer.starts-at', 'Started'), value: new Date(alert.startsAt).toLocaleString() },
    { label: t('alerts.drawer.updated-at', 'Updated'), value: new Date(alert.updatedAt).toLocaleString() },
    { label: t('alerts.drawer.ends-at', 'Ends'), value: new Date(alert.endsAt).toLocaleString() },
  ];

  const receiverItems = alert.receivers.map((r) => ({ label: t('alerts.drawer.receiver', 'Receiver'), value: r.name }));

  // Each row only shows up when Alertmanager reports something for it, so anything
  // we skip becomes undefined and gets dropped below.
  const detailItems: DetailItem[] = [
    alert.generatorURL && {
      label: t('alerts.drawer.generator-url', 'Generator URL'),
      // TextLink sanitizes the href for us – generatorURL comes from
      // untrusted alert data (any client that can POST /api/v2/alerts).
      value: (
        <TextLink href={alert.generatorURL} external>
          {alert.generatorURL}
        </TextLink>
      ),
    },
    isSilenced && {
      label: t('alerts.drawer.silenced-by', 'Silenced by'),
      value: <SilencedBy silenceIds={alert.status.silencedBy} canViewSilences={canViewSilences} />,
    },
    alert.status.inhibitedBy.length > 0 && {
      label: t('alerts.drawer.inhibited-by', 'Inhibited by'),
      value: alert.status.inhibitedBy.join(', '),
    },
    alert.status.mutedBy.length > 0 && {
      label: t('alerts.drawer.muted-by', 'Muted by'),
      value: alert.status.mutedBy.join(', '),
    },
  ].filter(isTruthy);

  // "Silence" prefills every label the instance carries, so the silence lands on exactly this
  // instance. Once it is silenced, the useful next step is the silence itself rather than
  // stacking a second one on top.
  const showManageSilences = isSilenced && canViewSilences;
  const showSilenceAction = !isSilenced && canMutateSilences;

  const footer = (
    <Stack direction="row" gap={1}>
      {showManageSilences && (
        <LinkButton variant="secondary" icon="bell" href={silencesNav.listPageLink(alert.status.silencedBy)}>
          {t('alerts.drawer.manage-silences', 'Manage silences')}
        </LinkButton>
      )}
      {showSilenceAction && (
        <LinkButton variant="secondary" icon="bell-slash" href={silencesNav.createForAlertInstanceLink(alert.labels)}>
          {t('alerts.drawer.silence', 'Silence')}
        </LinkButton>
      )}
    </Stack>
  );

  return (
    <DrawerWithFooter
      title={t('alerts.drawer.title', 'Alert details')}
      onClose={onClose}
      size="sm"
      footer={showManageSilences || showSilenceAction ? footer : undefined}
    >
      <Stack direction="column" gap={3}>
        <Stack direction="row" alignItems="center">
          <AlertStateBadge alert={alert} />
        </Stack>

        {labelItems.length > 0 && (
          <Section title={t('alerts.drawer.section.labels', 'Labels')}>
            <KeyValueList items={labelItems} />
          </Section>
        )}

        {annotationItems.length > 0 && (
          <Section title={t('alerts.drawer.section.annotations', 'Annotations')}>
            <KeyValueList items={annotationItems} />
          </Section>
        )}

        <Section title={t('alerts.drawer.section.timing', 'Timing')}>
          <KeyValueList items={timingItems} />
        </Section>

        {receiverItems.length > 0 && (
          <Section title={t('alerts.drawer.section.receivers', 'Receivers')}>
            <KeyValueList items={receiverItems} />
          </Section>
        )}

        {detailItems.length > 0 && (
          <Section title={t('alerts.drawer.section.details', 'Details')}>
            <KeyValueList items={detailItems} />
          </Section>
        )}
      </Stack>
    </DrawerWithFooter>
  );
}

interface SilencedByProps {
  silenceIds: string[];
  canViewSilences: boolean;
}

/** Links each silence to the silences list, unless the user isn't allowed to see silences. */
function SilencedBy({ silenceIds, canViewSilences }: SilencedByProps) {
  if (!canViewSilences) {
    return <>{silenceIds.join(', ')}</>;
  }

  return (
    <Stack direction="row" gap={0.5} wrap="wrap">
      {silenceIds.map((silenceId) => (
        <TextLink key={silenceId} href={silencesNav.listPageLink([silenceId])}>
          {silenceId}
        </TextLink>
      ))}
    </Stack>
  );
}
