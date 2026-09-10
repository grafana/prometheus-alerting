import React, { useState } from 'react';
import { t } from '@grafana/i18n';
import { Alert, Stack, Button, ConfirmModal } from '@grafana/ui';
import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { useDeleteTimeInterval } from '../hooks/useTimeIntervals';
import { isAbilityAllowed } from '../../../access-control/abilities';
import { useAlertmanagerConfigMutationAbility } from '../../../hooks/useAlertmanagerConfigMutationAbility';
import { MutationError } from '../../../access-control/components/MutationError';
import { TimeIntervalScheduleDetails } from './TimeIntervalScheduleDetails';

interface TimeIntervalDetailsProps {
  timeInterval: TimeInterval;
}

function TimeIntervalDetails({ timeInterval }: TimeIntervalDetailsProps) {
  if (!timeInterval.time_intervals || timeInterval.time_intervals.length === 0) {
    return (
      <Alert title={t('time-intervals.no-intervals', 'No time intervals')} severity="info">
        {t('time-intervals.drawer.no-intervals-desc', 'This time interval has no configuration.')}
      </Alert>
    );
  }

  return <TimeIntervalScheduleDetails timeInterval={timeInterval} />;
}

interface TimeIntervalDrawerViewProps {
  timeInterval: TimeInterval;
  onEdit: () => void;
  onClose: () => void;
}

export function TimeIntervalDrawerView({ timeInterval, onEdit, onClose }: TimeIntervalDrawerViewProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const canMutateTimeIntervals = isAbilityAllowed(useAlertmanagerConfigMutationAbility());
  const [deleteTimeInterval, { isLoading: isDeleting, error: deleteError }] = useDeleteTimeInterval();

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
      <MutationError
        error={deleteError}
        fallbackTitle={t('time-intervals.error-deleting-title', 'Error deleting time interval')}
        resource={t('time-intervals.resource-label', 'time intervals')}
      />

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
        isOpen={isConfirmModalOpen}
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
        confirmButtonVariant="destructive"
      />
    </>
  );
}
