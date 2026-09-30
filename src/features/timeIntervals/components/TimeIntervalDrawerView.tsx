import React, { useMemo, useState } from 'react';
import { t } from '@grafana/i18n';
import { Alert, Stack, Button, ConfirmModal } from '@grafana/ui';
import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { useDeleteTimeInterval } from '../hooks/useTimeIntervals';
import { isAbilityAllowed } from '../../../access-control/abilities';
import { useAlertmanagerConfigMutationAbility } from '../../../hooks/useAlertmanagerConfigMutationAbility';
import { MutationError } from '../../../access-control/components/MutationError';
import { useRoutes } from '../../routes/hooks/useRoutes';
import { findTimeIntervalUses, type TimeIntervalUse } from '../../../reducers/alertmanager/utils/muteTimings.utils';
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

/**
 * Lists the routes that depend on this time interval, so the user knows what to change.
 * A route's receiver is the only human-readable handle it has, and a child route can inherit
 * one from its parent, so some entries can only be described rather than named.
 */
function DependentRoutes({ uses }: { uses: TimeIntervalUse[] }) {
  return (
    <ul>
      {uses.map(({ receiver, usedAs }, index) => (
        <li key={`${receiver ?? ''}-${usedAs}-${index}`}>
          {receiver ?? t('time-intervals.in-use.inherited-receiver', 'a route that inherits its receiver')}
          {' — '}
          {usedAs === 'mute'
            ? t('time-intervals.in-use.as-mute', 'mute timing')
            : t('time-intervals.in-use.as-active', 'active timing')}
        </li>
      ))}
    </ul>
  );
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

  // Deleting an interval strips it from every route that mentions it, turning that route's mute
  // or active window off without saying so. Look the references up first and block the delete
  // while any exist, so the user changes the routes deliberately instead of finding out later.
  const { route } = useRoutes();
  const uses = useMemo(() => (route ? findTimeIntervalUses(timeInterval.name, route) : []), [route, timeInterval.name]);
  const isInUse = uses.length > 0;

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

      {isInUse && (
        <Alert title={t('time-intervals.in-use.title', 'This time interval is in use')} severity="info">
          <p>
            {t(
              'time-intervals.in-use.body',
              'Removing it would change when the routes below notify, so it has to be taken out of them first.'
            )}
          </p>
          <DependentRoutes uses={uses} />
        </Alert>
      )}

      {canMutateTimeIntervals && (
        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <Stack gap={2} justifyContent="space-between">
            <Button variant="secondary" onClick={onEdit}>
              {t('time-intervals.drawer.edit', 'Edit')}
            </Button>
            <div style={{ flex: 1 }} />
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isDeleting || isInUse}
              tooltip={
                isInUse
                  ? t('time-intervals.in-use.tooltip', 'Remove this time interval from the routes using it first')
                  : undefined
              }
            >
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
