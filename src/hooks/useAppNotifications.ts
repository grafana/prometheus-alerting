import { useCallback } from 'react';

import { AppEvents } from '@grafana/data';
import { getAppEvents } from '@grafana/runtime';

/** Provides stable helpers for publishing Grafana application notifications. */
export function useAppNotifications() {
  const success = useCallback((title: string, description = '') => {
    getAppEvents().publish({
      type: AppEvents.alertSuccess.name,
      payload: [title, description],
    });
  }, []);

  const error = useCallback((title: string, description = '') => {
    getAppEvents().publish({
      type: AppEvents.alertError.name,
      payload: [title, description],
    });
  }, []);

  return { success, error };
}
