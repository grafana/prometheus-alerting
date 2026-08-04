import React, { useState } from 'react';
import { t } from '@grafana/i18n';
import { Stack, Text } from '@grafana/ui';
import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { TimeIntervalDrawerView } from './TimeIntervalDrawerView';
import { TimeIntervalDrawerEdit } from './TimeIntervalDrawerEdit';

interface TimeIntervalDrawerProps {
  timeInterval: TimeInterval | null;
  onClose: () => void;
}

export function TimeIntervalDrawer({ timeInterval, onClose }: TimeIntervalDrawerProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  if (!timeInterval) {
    return null;
  }

  const handleEdit = () => {
    setIsEditMode(true);
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
      {isEditMode ? (
        <TimeIntervalDrawerEdit timeInterval={timeInterval} onCancel={handleCancelEdit} onSuccess={handleEditSuccess} />
      ) : (
        <TimeIntervalDrawerView timeInterval={timeInterval} onEdit={handleEdit} onClose={onClose} />
      )}
    </DrawerWithFooter>
  );
}
