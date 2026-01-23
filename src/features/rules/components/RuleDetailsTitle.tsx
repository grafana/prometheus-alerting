import React from 'react';
import { Stack, Text } from '@grafana/ui';
import { StateText } from '@grafana/alerting/unstable';

interface RuleDetailsTitleProps {
  name: string;
  type: 'alerting' | 'recording';
  state?: string;
  health?: string;
}

export function RuleDetailsTitle({ name, type, state, health }: RuleDetailsTitleProps) {
  const normalizedState = normalizeState(state);
  const normalizedHealth = normalizeHealth(health);

  return (
    <Stack direction="row" gap={1} alignItems="center">
      <Text variant="h1" truncate>
        {name}
      </Text>
      {type === 'alerting' && (
        <StateText type="alerting" state={normalizedState} health={normalizedHealth} />
      )}
      {type === 'recording' && <StateText type="recording" health={normalizedHealth} />}
    </Stack>
  );
}

// Helper functions

function normalizeState(state?: string): 'normal' | 'firing' | 'pending' | 'unknown' | 'recovering' {
  if (!state || state === 'inactive') {
    return 'normal';
  }
  if (['firing', 'pending', 'unknown', 'recovering'].includes(state)) {
    return state as 'firing' | 'pending' | 'unknown' | 'recovering';
  }
  return 'unknown';
}

function normalizeHealth(health?: string): 'nodata' | 'error' | undefined {
  if (!health) {
    return undefined;
  }
  if (health === 'nodata' || health === 'error') {
    return health;
  }
  return undefined;
}
