import { useCallback } from 'react';

import { STORAGE_KEYS } from '../constants';
import { setDataSourceUID } from '../store/datasourceSlice';
import { useAppDispatch } from '../store/hooks';

/**
 * Switches the plugin to another Alertmanager, and remembers it for the rest of the browser session so
 * the next page load starts there too.
 */
export function useSelectAlertmanager(): (uid: string) => void {
  const dispatch = useAppDispatch();

  return useCallback(
    (uid: string) => {
      sessionStorage.setItem(STORAGE_KEYS.SELECTED_ALERTMANAGER_UID, uid);
      dispatch(setDataSourceUID(uid));
    },
    [dispatch]
  );
}
