import React from 'react';

import { t } from '@grafana/i18n';
import { AlertLabel } from '@grafana/alerting';
import { Stack } from '@grafana/ui';
import type { GettableAlert } from '@grafana/external-alertmanager/vanilla';

import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { KeyValueList } from '../../../components/KeyValueList/KeyValueList';
import { Section } from '../../../components/KeyValueList/Section';
import { AlertStateBadge } from './AlertStateBadge';

interface AlertDrawerProps {
  alert: GettableAlert;
  onClose: () => void;
}

export function AlertDrawer({ alert, onClose }: AlertDrawerProps) {
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

  const statusItems = [
    ...(alert.status.silencedBy.length > 0
      ? [{ label: t('alerts.drawer.silenced-by', 'Silenced by'), value: alert.status.silencedBy.join(', ') }]
      : []),
    ...(alert.status.inhibitedBy.length > 0
      ? [{ label: t('alerts.drawer.inhibited-by', 'Inhibited by'), value: alert.status.inhibitedBy.join(', ') }]
      : []),
    ...(alert.status.mutedBy.length > 0
      ? [{ label: t('alerts.drawer.muted-by', 'Muted by'), value: alert.status.mutedBy.join(', ') }]
      : []),
  ];

  return (
    <DrawerWithFooter
      title={t('alerts.drawer.title', 'Alert details')}
      onClose={onClose}
      size="sm"
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

        {(alert.generatorURL || statusItems.length > 0) && (
          <Section title={t('alerts.drawer.section.details', 'Details')}>
            <KeyValueList
              items={[
                ...(alert.generatorURL
                  ? [
                      {
                        label: t('alerts.drawer.generator-url', 'Generator URL'),
                        value: (
                          <a href={alert.generatorURL} target="_blank" rel="noreferrer">
                            {alert.generatorURL}
                          </a>
                        ),
                      },
                    ]
                  : []),
                ...statusItems,
              ]}
            />
          </Section>
        )}
      </Stack>
    </DrawerWithFooter>
  );
}
