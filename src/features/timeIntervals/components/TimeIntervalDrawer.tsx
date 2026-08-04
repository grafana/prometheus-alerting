import React, { useState } from 'react';
import { t } from '@grafana/i18n';
import { Stack, Text } from '@grafana/ui';
import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { TimeIntervalDrawerView } from './TimeIntervalDrawerView';
import { TimeIntervalDrawerEdit } from './TimeIntervalDrawerEdit';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';
import { getAlertmanagerConfigMutationAbility } from '../../../access-control/abilities.alertmanager';
import { isAbilityAllowed } from '../../../access-control/abilities';

interface TimeIntervalDrawerProps {
  timeInterval: TimeInterval | null;
  onClose: () => void;
}

export function TimeIntervalDrawer({ timeInterval, onClose }: TimeIntervalDrawerProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const hasConfigurationAPI = useHasConfigurationAPI();
  const canMutateTimeIntervals = isAbilityAllowed(getAlertmanagerConfigMutationAbility(hasConfigurationAPI));
  const effectiveIsEditMode = canMutateTimeIntervals && isEditMode;

  if (!timeInterval) {
    return null;
  }

  const handleEdit = () => {
    if (canMutateTimeIntervals) {
      setIsEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleEditSuccess = () => {
    setIsEditMode(false);
    onClose();
  };

  return (
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
      size="sm"
    >
      {effectiveIsEditMode ? (
        <TimeIntervalDrawerEdit timeInterval={timeInterval} onCancel={handleCancelEdit} onSuccess={handleEditSuccess} />
      ) : (
        <TimeIntervalDrawerView timeInterval={timeInterval} onEdit={handleEdit} onClose={onClose} />
      )}
    </DrawerWithFooter>
  );
}
