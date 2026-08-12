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

/** Formats a date for a `datetime-local` input, which expects local time as `YYYY-MM-DDTHH:mm`. */
export const formatDateTimeLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
