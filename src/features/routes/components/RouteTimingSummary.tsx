import { css, cx } from '@emotion/css';
import React from 'react';

import type { GrafanaTheme2 } from '@grafana/data';
import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';
import { Badge, Box, Stack, Text, useStyles2 } from '@grafana/ui';

import { formatTimeIntervalSchedule } from '../../timeIntervals/utils/timeIntervals';

interface RouteTimingSummaryProps {
  muteTimeIntervalNames: string[];
  activeTimeIntervalNames: string[];
  timeIntervals: TimeInterval[];
}

export function RouteTimingSummary({
  muteTimeIntervalNames,
  activeTimeIntervalNames,
  timeIntervals,
}: RouteTimingSummaryProps) {
  const styles = useStyles2(getStyles);
  const intervalsByName = new Map(timeIntervals.map((interval) => [interval.name, interval]));
  const activeTimeIntervals = activeTimeIntervalNames.flatMap((name) => {
    const interval = intervalsByName.get(name);
    return interval ? [interval] : [];
  });
  const muteTimeIntervals = muteTimeIntervalNames.flatMap((name) => {
    const interval = intervalsByName.get(name);
    return interval ? [interval] : [];
  });

  if (activeTimeIntervals.length === 0 && muteTimeIntervals.length === 0) {
    return null;
  }

  // Alertmanager applies active and mute timings as independent, sequential pipeline stages.
  // A notification survives only if it is inside an active interval and outside every mute interval.
  // Stage order: https://github.com/prometheus/alertmanager/blob/f5706fbac77b1a9a8d5c64501511fc148f00164e/notify/notify.go#L175-L184
  // Sequential execution: https://github.com/prometheus/alertmanager/blob/f5706fbac77b1a9a8d5c64501511fc148f00164e/notify/notify.go#L246-L260
  // Mute-stage behavior: https://github.com/prometheus/alertmanager/blob/f5706fbac77b1a9a8d5c64501511fc148f00164e/notify/mute.go#L180-L197
  const behaviorDescription =
    activeTimeIntervals.length > 0 && muteTimeIntervals.length > 0
      ? t(
          'routes.edit.timing-summary-active-and-muted',
          'Both conditions apply: notifications are sent only when at least one active timing matches and no mute timing matches.'
        )
      : activeTimeIntervals.length > 0
        ? t(
            'routes.edit.timing-summary-active-only',
            'Notifications are sent only when at least one active timing matches.'
          )
        : t('routes.edit.timing-summary-muted-only', 'Notifications are not sent when any mute timing matches.');

  return (
    <div className={styles.summary}>
      <Box padding={2} backgroundColor="secondary" borderRadius="default">
        <Stack direction="column" gap={2}>
          <Stack direction="column" gap={0.5}>
            <Text element="h3" variant="h5">
              {t('routes.edit.timing-summary-title', 'Timing behavior')}
            </Text>
            <Text variant="bodySmall" color="secondary">
              {behaviorDescription}
            </Text>
          </Stack>
          <div className={styles.sections}>
            {activeTimeIntervals.length > 0 && (
              <TimingSection
                title={t('routes.edit.timing-summary-active-title', 'Active')}
                timeIntervals={activeTimeIntervals}
                tone="active"
              />
            )}
            {muteTimeIntervals.length > 0 && (
              <TimingSection
                title={t('routes.edit.timing-summary-muted-title', 'Muted')}
                timeIntervals={muteTimeIntervals}
                tone="muted"
              />
            )}
          </div>
        </Stack>
      </Box>
    </div>
  );
}

interface TimingSectionProps {
  title: string;
  timeIntervals: TimeInterval[];
  tone: 'active' | 'muted';
}

function TimingSection({ title, timeIntervals, tone }: TimingSectionProps) {
  const styles = useStyles2(getStyles);
  const badgeColor = tone === 'active' ? 'green' : 'red';

  return (
    <section className={cx(styles.section, tone === 'active' ? styles.activeSection : styles.mutedSection)}>
      <Text element="h4" variant="bodySmall" weight="medium">
        {title}
      </Text>
      <Stack direction="column" gap={1.5}>
        {timeIntervals.map((interval) => (
          <div key={interval.name}>
            <Badge color={badgeColor} text={interval.name} />
            <Stack direction="column" gap={0.5}>
              {formatTimeIntervalSchedule(interval).map((schedule, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <div className={styles.alternative}>
                      <Text variant="bodySmall" color="secondary" weight="medium">
                        {t('routes.edit.timing-summary-alternative-label', 'OR')}
                      </Text>
                    </div>
                  )}
                  <div className={styles.schedule}>
                    <Text variant="bodySmall" color="secondary">
                      {schedule}
                    </Text>
                  </div>
                </React.Fragment>
              ))}
            </Stack>
          </div>
        ))}
      </Stack>
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  summary: css({
    overflow: 'hidden',
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
  }),
  sections: css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
    gap: theme.spacing(1.5),
  }),
  section: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5),
    background: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    borderLeftWidth: 3,
  }),
  activeSection: css({
    borderLeftColor: theme.colors.success.border,
  }),
  mutedSection: css({
    borderLeftColor: theme.colors.error.border,
  }),
  schedule: css({
    marginTop: theme.spacing(0.5),
    padding: theme.spacing(0.75, 1),
    background: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
  }),
  alternative: css({
    alignSelf: 'center',
    lineHeight: 1,
    marginTop: theme.spacing(0.5),
  }),
});
