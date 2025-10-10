import React, { useMemo } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { ROUTES, STORAGE_KEYS } from '../../constants';
import { StoreProvider } from '../StoreProvider/StoreProvider';
import { useAvailableAlertmanagers } from '../../hooks/useAvailableAlertmanager';

const Landing = React.lazy(() => import('../../pages/Landing'));
const Rules = React.lazy(() => import('../../pages/Rules/RulesList'));
const RouteTree = React.lazy(() => import('../../pages/Routes/RoutesList'));
const Receivers = React.lazy(() => import('../../pages/Receivers/ReceiversList'));
const Templates = React.lazy(() => import('../../pages/Templates/TemplatesList'));
const Silences = React.lazy(() => import('../../pages/Silences/SilencesList'));
const TimeIntervals = React.lazy(() => import('../../pages/TimeIntervals/TimeIntervalsList'));
const InhibitRules = React.lazy(() => import('../../pages/InhibitRules/InhibitRulesList'));

function App(_props: AppRootProps) {
  const alertmanagers = useAvailableAlertmanagers();

  const dataSourceUID = useMemo(() => {
    // Try to get the stored UID from sessionStorage
    const storedUID = sessionStorage.getItem(STORAGE_KEYS.SELECTED_ALERTMANAGER_UID);

    // If a UID is stored and it exists in the available alertmanagers, use it
    if (storedUID && alertmanagers.some((am) => am.uid === storedUID)) {
      return storedUID;
    }

    // Otherwise, use the first available alertmanager or fallback to default
    const firstAlertmanager = alertmanagers[0];
    if (firstAlertmanager) {
      // Store it in sessionStorage for next time
      sessionStorage.setItem(STORAGE_KEYS.SELECTED_ALERTMANAGER_UID, firstAlertmanager.uid);
      return firstAlertmanager.uid;
    }

    // Fallback to default if no alertmanagers are configured
    return 'gdev-alertmanager';
  }, [alertmanagers]);

  return (
    <StoreProvider initialDataSourceUID={dataSourceUID}>
      <Routes>
        <Route path={ROUTES.Routes} element={<RouteTree />} />
        <Route path={ROUTES.Rules} element={<Rules />} />
        <Route path={`${ROUTES.Receivers}/:id?`} element={<Receivers />} />
        <Route path={ROUTES.Templates} element={<Templates />} />
        <Route path={ROUTES.Silences} element={<Silences />} />
        <Route path={ROUTES.TimeIntervals} element={<TimeIntervals />} />
        <Route path={ROUTES.InhibitRules} element={<InhibitRules />} />

        {/* Default page */}
        <Route path="*" element={<Landing />} />
      </Routes>
    </StoreProvider>
  );
}

export default App;
