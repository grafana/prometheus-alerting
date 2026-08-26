import React from 'react';
import { css } from '@emotion/css';
import { t } from '@grafana/i18n';
import { Stack, Text } from '@grafana/ui';
import { StateText } from '@grafana/alerting/unstable';

import { FederatedGroupBadge } from './FederatedGroupBadge';

interface RuleDetailsTitleProps {
  name: string;
  type: 'alerting' | 'recording';
  state?: string;
  health?: string;
  /** Set when the rule's group reads data from other tenants, which gets it a badge. */
  sourceTenants?: string[];
}

export function RuleDetailsTitle({ name, type, state, health, sourceTenants }: RuleDetailsTitleProps) {
  const normalizedState = normalizeState(state);
  const normalizedHealth = normalizeHealth(health);

  // Build accessible label for state/health badge
  const getStateLabel = () => {
    if (normalizedHealth === 'error') {
      return 'Rule health: Error';
    }
    if (normalizedHealth === 'nodata') {
      return 'Rule health: No data';
    }
    if (normalizedState === 'firing') {
      return 'Rule state: Firing';
    }
    if (normalizedState === 'pending') {
      return 'Rule state: Pending';
    }
    if (normalizedState === 'normal') {
      return 'Rule state: Normal';
    }
    return 'Rule state: Unknown';
  };

  return (
    <Stack direction="row" gap={1} alignItems="center" minWidth={0}>
      <div className={nameStyles}>
        <Text variant="h1" element="h1" truncate>
          {name}
        </Text>
      </div>
      {type === 'alerting' && (
        <span aria-label={getStateLabel()}>
          <StateText type="alerting" state={normalizedState} health={normalizedHealth} />
        </span>
      )}
      {type === 'recording' && (
        <span
          aria-label={
            normalizedHealth === 'error'
              ? t('alerting.rule-details.recording-error', 'Rule health: Recording error')
              : t('alerting.rule-details.recording', 'Rule state: Recording')
          }
        >
          <StateText type="recording" health={normalizedHealth} />
        </span>
      )}
      {sourceTenants && <FederatedGroupBadge sourceTenants={sourceTenants} />}
    </Stack>
  );
}

const nameStyles = css({
  minWidth: 0,
  overflow: 'hidden',
});

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
