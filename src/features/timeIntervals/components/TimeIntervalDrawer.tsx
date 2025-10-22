import { css } from '@emotion/css';
import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Alert, Stack, useStyles2, Text, Button, ConfirmModal } from '@grafana/ui';
import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { KeyValueList } from '../../../components/KeyValueList';
import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import { deleteMuteTimingAction } from '../../../reducers/alertmanager/timeIntervals';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';

interface TimeIntervalDetailsProps {
  timeInterval: TimeInterval;
}

function TimeIntervalDetails({ timeInterval }: TimeIntervalDetailsProps) {
  const styles = useStyles2(getStyles);

  const formatTimeRange = (times?: Array<{ start_time: string; end_time: string }>) => {
    if (!times || times.length === 0) {
      return t('time-intervals.all-day', 'All day');
    }
    return times.map((t) => `${t.start_time} - ${t.end_time}`).join(', ');
  };

  const formatList = (items?: string[]) => {
    if (!items || items.length === 0) {
      return t('time-intervals.all', 'All');
    }
    return items.join(', ');
  };

  if (!timeInterval.time_intervals || timeInterval.time_intervals.length === 0) {
    return (
      <Alert title={t('time-intervals.no-intervals', 'No time intervals')} severity="info">
        {t('time-intervals.no-intervals-desc', 'This time interval has no configuration.')}
      </Alert>
    );
  }

  return (
    <Stack direction="column" gap={2}>
      {timeInterval.time_intervals.map((ti, index) => {
        const items = [
          { label: t('time-intervals.times-label', 'Times'), value: formatTimeRange(ti.times) },
          ...(ti.weekdays && ti.weekdays.length > 0
            ? [{ label: t('time-intervals.weekdays-label', 'Weekdays'), value: formatList(ti.weekdays) }]
            : []),
          ...(ti.days_of_month && ti.days_of_month.length > 0
            ? [{ label: t('time-intervals.days-of-month-label', 'Days of Month'), value: formatList(ti.days_of_month) }]
            : []),
          ...(ti.months && ti.months.length > 0
            ? [{ label: t('time-intervals.months-label', 'Months'), value: formatList(ti.months) }]
            : []),
          ...(ti.years && ti.years.length > 0
            ? [{ label: t('time-intervals.years-label', 'Years'), value: formatList(ti.years) }]
            : []),
          ...(ti.location ? [{ label: t('time-intervals.location-label', 'Location'), value: ti.location }] : []),
        ];

        return (
          <div key={index} className={styles.intervalCard}>
            <h4 className={styles.intervalTitle}>
              {t('time-intervals.interval-number', 'Interval {{number}}', { number: index + 1 })}
            </h4>
            <KeyValueList items={items} />
          </div>
        );
      })}
    </Stack>
  );
}

interface TimeIntervalDrawerProps {
  timeInterval: TimeInterval | null;
  onClose: () => void;
  onEdit?: (timeInterval: TimeInterval) => void;
}

export function TimeIntervalDrawer({ timeInterval, onClose, onEdit }: TimeIntervalDrawerProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasConfigurationAPI = useHasConfigurationAPI();
  const [produceNewConfig, { error: deleteError }] = useProduceNewAlertmanagerConfiguration();

  if (!timeInterval) {
    return null;
  }

  const handleEdit = () => {
    onEdit?.(timeInterval);
  };

  const handleRemove = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmRemove = async () => {
    setIsDeleting(true);
    try {
      await produceNewConfig(deleteMuteTimingAction({ name: timeInterval.name }));
      setIsConfirmModalOpen(false);
      onClose();
      // The list will automatically refresh due to cache invalidation
    } catch (err) {
      console.error('Failed to delete time interval:', err);
      setIsDeleting(false);
      // Keep modal open on error so user can retry
    }
  };

  const handleCancelRemove = () => {
    setIsConfirmModalOpen(false);
  };

  const hasActions = onEdit || hasConfigurationAPI;

  return (
    <>
      <DrawerWithFooter
        title={
          <Stack direction="column" gap={0}>
            <Text variant="bodySmall" color="secondary">
              {t('time-intervals.detail.title', 'Time Interval')}
            </Text>
            <Text variant="h2">{timeInterval.name}</Text>
          </Stack>
        }
        onClose={onClose}
        width={400}
        footer={
          hasActions ? (
            <Stack gap={2} justifyContent="space-between">
              {onEdit && (
                <Button variant="secondary" onClick={handleEdit}>
                  {t('time-intervals.drawer.edit', 'Edit')}
                </Button>
              )}
              <div style={{ flex: 1 }} />
              {hasConfigurationAPI && (
                <Button variant="destructive" onClick={handleRemove} disabled={isDeleting}>
                  {t('time-intervals.drawer.remove', 'Remove')}
                </Button>
              )}
            </Stack>
          ) : undefined
        }
      >
        {deleteError && (
          <Alert title={t('time-intervals.error-deleting-title', 'Error deleting time interval')} severity="error">
            {deleteError instanceof Error
              ? deleteError.message
              : t('time-intervals.error-deleting-message', 'Failed to delete time interval')}
          </Alert>
        )}
        <TimeIntervalDetails timeInterval={timeInterval} />
      </DrawerWithFooter>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title={t('time-intervals.confirm-remove.title', 'Remove Time Interval')}
        body={t(
          'time-intervals.confirm-remove.body',
          'Are you sure you want to remove the time interval "{{name}}"? This action cannot be undone.',
          { name: timeInterval.name }
        )}
        confirmText={t('time-intervals.confirm-remove.confirm', 'Remove')}
        dismissText={t('time-intervals.confirm-remove.cancel', 'Cancel')}
        icon="exclamation-triangle"
        onConfirm={handleConfirmRemove}
        onDismiss={handleCancelRemove}
        confirmButtonVariant="destructive"
      />
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  intervalCard: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
    backgroundColor: theme.colors.background.secondary,
  }),
  intervalTitle: css({
    margin: 0,
    marginBottom: theme.spacing(2),
    fontSize: theme.typography.h5.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    paddingBottom: theme.spacing(1),
    borderBottom: `1px solid ${theme.colors.border.weak}`,
  }),
});
