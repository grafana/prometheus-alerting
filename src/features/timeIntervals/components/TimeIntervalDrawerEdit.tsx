import React from 'react';
import { t } from '@grafana/i18n';
import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { useUpdateTimeInterval } from '../hooks/useTimeIntervals';
import { TimeIntervalFormFields } from './TimeIntervalFormFields';

interface TimeIntervalDrawerEditProps {
  timeInterval: TimeInterval;
  onCancel: () => void;
  onSuccess: () => void;
}

export function TimeIntervalDrawerEdit({ timeInterval, onCancel, onSuccess }: TimeIntervalDrawerEditProps) {
  const [updateTimeInterval, { isLoading: isUpdating, error: updateError }] = useUpdateTimeInterval();

  const handleSave = async (updatedTimeInterval: TimeInterval) => {
    try {
      await updateTimeInterval(updatedTimeInterval, timeInterval.name);
      onSuccess();
    } catch (err) {
      console.error('Failed to update time interval:', err);
    }
  };

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
