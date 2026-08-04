import React from 'react';
import { t } from '@grafana/i18n';
import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { useUpdateTimeInterval } from '../hooks/useTimeIntervals';
import { TimeIntervalFormFields, type TimeIntervalFormData } from './TimeIntervalFormFields';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';
import { getAlertmanagerConfigMutationAbility } from '../../../access-control/abilities.alertmanager';
import { isAbilityAllowed } from '../../../access-control/abilities';

interface TimeIntervalDrawerEditProps {
  timeInterval: TimeInterval;
  onCancel: () => void;
  onSuccess: () => void;
}

export function TimeIntervalDrawerEdit({ timeInterval, onCancel, onSuccess }: TimeIntervalDrawerEditProps) {
  const [updateTimeInterval, { isLoading: isUpdating, error: updateError }] = useUpdateTimeInterval();
  const hasConfigurationAPI = useHasConfigurationAPI();
  const canMutateTimeIntervals = isAbilityAllowed(getAlertmanagerConfigMutationAbility(hasConfigurationAPI));

  const handleSave = async (data: TimeIntervalFormData) => {
    if (!canMutateTimeIntervals) {
      return;
    }

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
      onSuccess();
    } catch (err) {
      console.error('Failed to update time interval:', err);
    }
  };

  if (!canMutateTimeIntervals) {
    return null;
  }

  return (
    <TimeIntervalFormFields
      timeInterval={timeInterval}
      onSubmit={handleSave}
      onCancel={onCancel}
      isLoading={isUpdating}
      error={updateError}
      submitButtonText={
        isUpdating ? t('time-intervals.edit.updating', 'Updating...') : t('time-intervals.edit.update-button', 'Update')
      }
      cancelButtonText={t('time-intervals.edit.cancel-button', 'Cancel')}
      showNameField={false}
    />
  );
}
