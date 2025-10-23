import React, { useState } from 'react';
import { t } from '@grafana/i18n';
import { Alert, Stack, Text, Button, ConfirmModal } from '@grafana/ui';
import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { KeyValueList } from '../../../components/KeyValueList';
import { Section } from '../../../components/KeyValueList/Section';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';
import { useDeleteTimeInterval, useUpdateTimeInterval } from '../hooks/useTimeIntervals';
import { TimeIntervalFormFields, type TimeIntervalFormData } from './TimeIntervalFormFields';

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

interface TimeIntervalDrawerProps {
  timeInterval: TimeInterval | null;
  onClose: () => void;
}

export function TimeIntervalDrawer({ timeInterval, onClose }: TimeIntervalDrawerProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const hasConfigurationAPI = useHasConfigurationAPI();
  const [deleteTimeInterval, { isLoading: isDeleting, error: deleteError }] = useDeleteTimeInterval();
  const [updateTimeInterval, { isLoading: isUpdating, error: updateError }] = useUpdateTimeInterval();

  if (!timeInterval) {
    return null;
  }

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSaveEdit = async (data: TimeIntervalFormData) => {
    const updatedTimeInterval = {
      name: data.name,
      time_intervals: [
        {
          times: [
            {
              start_time: data.startTime,
              end_time: data.endTime,
            },
          ],
          weekdays: data.weekdays ? data.weekdays.split(',').map((d) => d.trim()) : undefined,
          days_of_month: data.daysOfMonth ? data.daysOfMonth.split(',').map((d) => d.trim()) : undefined,
          months: data.months ? data.months.split(',').map((m) => m.trim()) : undefined,
          years: data.years ? data.years.split(',').map((y) => y.trim()) : undefined,
          location: data.location || undefined,
        },
      ],
    };

    try {
      await updateTimeInterval(updatedTimeInterval, timeInterval.name);
      setIsEditMode(false);
      onClose();
    } catch (err) {
      console.error('Failed to update time interval:', err);
    }
  };

  const handleRemove = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmRemove = async () => {
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
        width={isEditMode ? 500 : 400}
        footer={
          !isEditMode && hasConfigurationAPI ? (
            <Stack gap={2} justifyContent="space-between">
              <Button variant="secondary" onClick={handleEdit}>
                {t('time-intervals.drawer.edit', 'Edit')}
              </Button>
              <div style={{ flex: 1 }} />
              <Button variant="destructive" onClick={handleRemove} disabled={isDeleting}>
                {t('time-intervals.drawer.remove', 'Remove')}
              </Button>
            </Stack>
          ) : undefined
        }
      >
        {Boolean(deleteError) && (
          <Alert title={t('time-intervals.error-deleting-title', 'Error deleting time interval')} severity="error">
            {String(
              deleteError instanceof Error
                ? deleteError.message
                : t('time-intervals.error-deleting-message', 'Failed to delete time interval')
            )}
          </Alert>
        )}
        {isEditMode ? (
          <TimeIntervalFormFields
            timeInterval={timeInterval}
            onSubmit={handleSaveEdit}
            onCancel={handleCancelEdit}
            isLoading={isUpdating}
            error={updateError}
            submitButtonText={
              isUpdating
                ? t('time-intervals.edit.updating', 'Updating...')
                : t('time-intervals.edit.update-button', 'Update')
            }
            cancelButtonText={t('time-intervals.edit.cancel-button', 'Cancel')}
            showNameField={false}
          />
        ) : (
          <TimeIntervalDetails timeInterval={timeInterval} />
        )}
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
