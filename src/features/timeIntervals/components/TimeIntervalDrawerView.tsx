import React, { useState } from 'react';
import { t } from '@grafana/i18n';
import { Alert, Stack, Button, ConfirmModal } from '@grafana/ui';
import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { KeyValueList } from '../../../components/KeyValueList';
import { Section } from '../../../components/KeyValueList/Section';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';
import { useDeleteTimeInterval } from '../hooks/useTimeIntervals';
import { getAlertmanagerConfigMutationAbility } from '../../../access-control/abilities.alertmanager';
import { isAbilityAllowed } from '../../../access-control/abilities';
import { getTimeIntervalMutationErrorFeedback } from '../utils/errorFeedback';

interface TimeIntervalDetailsProps {
  timeInterval: TimeInterval;
}

function TimeIntervalDetails({ timeInterval }: TimeIntervalDetailsProps) {
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
        {t('time-intervals.drawer.no-intervals-desc', 'This time interval has no configuration.')}
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
          <Section
            key={index}
            title={t('time-intervals.interval-number', 'Interval {{number}}', { number: index + 1 })}
          >
            <KeyValueList items={items} />
          </Section>
        );
      })}
    </Stack>
  );
}

interface TimeIntervalDrawerViewProps {
  timeInterval: TimeInterval;
  onEdit: () => void;
  onClose: () => void;
}

export function TimeIntervalDrawerView({ timeInterval, onEdit, onClose }: TimeIntervalDrawerViewProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const hasConfigurationAPI = useHasConfigurationAPI();
  const canMutateTimeIntervals = isAbilityAllowed(getAlertmanagerConfigMutationAbility(hasConfigurationAPI));
  const [deleteTimeInterval, { isLoading: isDeleting, error: deleteError }] = useDeleteTimeInterval();

  const handleRemove = () => {
    if (canMutateTimeIntervals) {
      setIsConfirmModalOpen(true);
    }
  };

  const handleConfirmRemove = async () => {
    if (!canMutateTimeIntervals) {
      return;
    }

    try {
      await deleteTimeInterval(timeInterval.name);
      setIsConfirmModalOpen(false);
      onClose();
      // The list will automatically refresh due to cache invalidation
    } catch (err) {
      console.error('Failed to delete time interval:', err);
      // Keep modal open on error so user can retry
    }
  };

  const handleCancelRemove = () => {
    setIsConfirmModalOpen(false);
  };

  return (
    <>
      {Boolean(deleteError) &&
        (() => {
          const feedback = getTimeIntervalMutationErrorFeedback(
            deleteError,
            t('time-intervals.error-deleting-title', 'Error deleting time interval')
          );
          return (
            <Alert title={feedback.title} severity="error">
              {feedback.description}
            </Alert>
          );
        })()}

      <TimeIntervalDetails timeInterval={timeInterval} />

      {canMutateTimeIntervals && (
        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <Stack gap={2} justifyContent="space-between">
            <Button variant="secondary" onClick={onEdit}>
              {t('time-intervals.drawer.edit', 'Edit')}
            </Button>
            <div style={{ flex: 1 }} />
            <Button variant="destructive" onClick={handleRemove} disabled={isDeleting}>
              {t('time-intervals.drawer.remove', 'Remove')}
            </Button>
          </Stack>
        </div>
      )}

      <ConfirmModal
        isOpen={canMutateTimeIntervals && isConfirmModalOpen}
        title={t('time-intervals.confirm-remove.title', 'Remove Time Interval')}
        body={t(
          'time-intervals.confirm-remove.body',
          'Are you sure you want to remove the time interval "{{name}}"? This action cannot be undone.',
          { name: timeInterval.name }
        )}
        confirmText={t('time-intervals.confirm-remove.confirm', 'Remove')}
        dismissText={t('time-intervals.confirm-remove.cancel', 'Cancel')}
        onConfirm={handleConfirmRemove}
        onDismiss={handleCancelRemove}
        confirmVariant="destructive"
      />
    </>
  );
}
