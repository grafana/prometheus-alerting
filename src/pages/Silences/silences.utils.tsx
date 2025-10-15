import React from 'react';
import { Badge } from '@grafana/ui';
import type { GettableSilence } from '@grafana/external-alertmanager/vanilla';

export const getStatusBadge = (state: 'expired' | 'active' | 'pending') => {
  const colorMap = {
    active: 'green',
    pending: 'blue',
    expired: 'red',
  } as const;

  return <Badge text={state} color={colorMap[state]} />;
};

export const formatMatchers = (silence: GettableSilence) => {
  return silence.matchers.map((m) => {
    let operator = '=';
    if (m.isRegex && m.isEqual === false) {
      operator = '!~';
    } else if (m.isRegex) {
      operator = '=~';
    } else if (m.isEqual === false) {
      operator = '!=';
    }
    return `${m.name}${operator}"${m.value}"`;
  });
};

export const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};
