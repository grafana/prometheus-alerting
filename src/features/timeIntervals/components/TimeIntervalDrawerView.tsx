import React, { useState } from 'react';
import { t } from '@grafana/i18n';
import { Alert, Stack, Button, ConfirmModal, Text, TextLink } from '@grafana/ui';
import type { TimeInterval, TimeIntervalUsage, TimeIntervalUse } from '@grafana/external-alertmanager/vanilla';
import { useDeleteTimeInterval } from '../hooks/useTimeIntervals';
import { isAbilityAllowed } from '../../../access-control/abilities';
import { useAlertmanagerConfigMutationAbility } from '../../../hooks/useAlertmanagerConfigMutationAbility';
import { MutationError } from '../../../access-control/components/MutationError';
import { routes as routesNav } from '../../../utils/navigation';
import { useAlertmanager } from '../../../hooks/useAlertmanager';
import { KeyValueList } from '../../../components/KeyValueList/KeyValueList';
import { Section } from '../../../components/KeyValueList/Section';
import { useTimeIntervalUses } from '../hooks/useTimeIntervalUses';
import { TimeIntervalScheduleSection } from './TimeIntervalScheduleSection';

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

  return <TimeIntervalScheduleSection timeInterval={timeInterval} />;
}

/**
 * Names a route the same way the route drawer's title does: by its matchers, or by its receiver
 * when it has none. A child route can have neither (it inherits its receiver), so it is described.
 */
function routeLabel({ matchers, receiver }: TimeIntervalUse) {
  if (matchers && matchers.length > 0) {
    return matchers.join(', ');
  }
  return receiver ?? t('time-intervals.in-use.inherited-receiver', 'A route that inherits its receiver');
}

function usageLabel(usage: TimeIntervalUsage) {
  return usage === 'mute'
    ? t('time-intervals.in-use.as-mute', 'Mute timing')
    : t('time-intervals.in-use.as-active', 'Active timing');
}

/**
 * Lists the routes that depend on this time interval, so the user knows what to change.
 * Each row links to the routes page with that route's drawer open. A route that both mutes
 * and restricts on the interval gets a row for each.
 */
function DependentRoutes({ uses }: { uses: TimeIntervalUse[] }) {
  const { uid: alertmanagerUID } = useAlertmanager();
  const items = uses.flatMap((use) =>
    use.usedAs.map((usage) => ({
      label: usageLabel(usage),
      value: (
        <TextLink href={routesNav.listPageLink(alertmanagerUID, use.routeId)} inline>
          {routeLabel(use)}
        </TextLink>
      ),
    }))
  );

  return (
    <Section title={t('time-intervals.in-use.heading', 'Used by routes')}>
      {items.length === 0 ? (
        <Text color="secondary">{t('time-intervals.in-use.none', 'No route uses this time interval')}</Text>
      ) : (
        <KeyValueList items={items} />
      )}
    </Section>
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
  const { getUses, isSuccess: hasLoadedRoutes } = useTimeIntervalUses();
  const uses = getUses(timeInterval.name);
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
      <Stack direction="column">
        <MutationError
          error={deleteError}
          fallbackTitle={t('time-intervals.error-deleting-title', 'Error deleting time interval')}
          resource={t('time-intervals.resource-label', 'time intervals')}
        />

        <TimeIntervalDetails timeInterval={timeInterval} />

        {hasLoadedRoutes && <DependentRoutes uses={uses} />}
      </Stack>

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
