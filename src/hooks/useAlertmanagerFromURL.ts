import { useEffect, useLayoutEffect, useState } from 'react';

import { ALERTMANAGER_QUERY_PARAM } from '../constants';
import { selectDataSourceUID } from '../store/datasourceSlice';
import { useAppSelector } from '../store/hooks';
import { findAlertmanagerUIDForQueryParam } from '../utils/utils.alertmanager';
import { useAvailableAlertmanagers } from './useAvailableAlertmanager';
import { useSelectAlertmanager } from './useSelectAlertmanager';
import { useURLSearchParams } from './useURLSearchParams';

/**
 * Selects the Alertmanager a link names in `?alertmanager=`, so a link from Grafana (or from a colleague)
 * opens the Alertmanager it was about rather than whichever one this browser tab picked last.
 *
 * The URL only decides when a new value shows up in it. After that:
 * - the param stays while it matches the selected Alertmanager, so the address bar can be shared as it is;
 * - a data source name is swapped for its UID;
 * - it's dropped when it doesn't match any Alertmanager, or when somebody picks another one in the picker,
 *   instead of switching them straight back.
 *
 * Returns true while the switch is still happening, so callers can hold off rendering a page that would
 * otherwise load, and briefly show, the previous Alertmanager's data.
 */
export function useAlertmanagerFromURL(): boolean {
  const availableAlertmanagers = useAvailableAlertmanagers();
  const selectedUID = useAppSelector(selectDataSourceUID);
  const selectAlertmanager = useSelectAlertmanager();
  const [searchParams, updateSearchParams] = useURLSearchParams();

  const paramValue = searchParams.get(ALERTMANAGER_QUERY_PARAM);
  const requestedUID = findAlertmanagerUIDForQueryParam(paramValue, availableAlertmanagers);

  // When a new value shows up in the URL, remember which Alertmanager it wants us to switch to. This is
  // worked out while rendering, rather than in an effect, so the page never renders against the old one.
  const [lastSeenValue, setLastSeenValue] = useState<string | null>(null);
  const [pendingUID, setPendingUID] = useState<string | undefined>(undefined);
  if (paramValue !== lastSeenValue) {
    setLastSeenValue(paramValue);
    setPendingUID(requestedUID !== selectedUID ? requestedUID : undefined);
  } else if (pendingUID !== undefined && pendingUID === selectedUID) {
    setPendingUID(undefined);
  }

  // A layout effect so the switch lands before the browser paints anything.
  useLayoutEffect(() => {
    if (pendingUID !== undefined) {
      selectAlertmanager(pendingUID);
    }
  }, [pendingUID, selectAlertmanager]);

  // Once the switch is done, the param should name the selected Alertmanager by UID, or not be there at
  // all. A plain effect rather than a layout one: on the first render the router doesn't listen for URL
  // changes until its own layout effect has run, which is after ours.
  const wantedValue = requestedUID === selectedUID ? requestedUID : undefined;
  const needsTidying = Boolean(paramValue) && pendingUID === undefined && paramValue !== wantedValue;
  useEffect(() => {
    if (needsTidying) {
      updateSearchParams({ [ALERTMANAGER_QUERY_PARAM]: wantedValue });
    }
  }, [needsTidying, wantedValue, updateSearchParams]);

  return pendingUID !== undefined;
}
