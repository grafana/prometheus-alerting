import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { config } from '@grafana/runtime';
import { ROUTES, STORAGE_KEYS } from '../../constants';
import { StoreProvider } from '../StoreProvider/StoreProvider';
import { createStore } from '../../store/store';

const Landing = React.lazy(() => import('../../pages/Landing'));
const Rules = React.lazy(() => import('../../features/rules/pages/RulesList'));
const RuleDetails = React.lazy(() => import('../../features/rules/pages/RuleDetails'));
const RuleEditor = React.lazy(() => import('../../features/rules/pages/RuleEditor'));
const RouteTree = React.lazy(() => import('../../features/routes/pages/RoutesList'));
const Receivers = React.lazy(() => import('../../features/receivers/pages/ReceiversList'));
const ReceiverDetail = React.lazy(() => import('../../features/receivers/pages/ReceiverDetail'));
const Templates = React.lazy(() => import('../../features/templates/pages/TemplatesList'));
const Silences = React.lazy(() => import('../../features/silences/pages/SilencesList'));
const SilenceForm = React.lazy(() => import('../../features/silences/pages/SilenceForm'));
const TimeIntervals = React.lazy(() => import('../../features/timeIntervals/pages/TimeIntervalsList'));
const TimeIntervalDetail = React.lazy(() => import('../../features/timeIntervals/pages/TimeIntervalDetail'));
const TimeIntervalForm = React.lazy(() => import('../../features/timeIntervals/pages/TimeIntervalForm'));
const InhibitRules = React.lazy(() => import('../../features/inhibitRules/pages/InhibitRulesList'));

// Get initial data source UID from sessionStorage or default to first available
function getInitialDataSourceUID(): string {
  const availableAlertmanagers = Object.values(config.datasources).filter((ds) => ds.type === 'alertmanager');

  // Try to get the stored UID from sessionStorage
  const storedUID = sessionStorage.getItem(STORAGE_KEYS.SELECTED_ALERTMANAGER_UID);

  // If a UID is stored and it exists in the available alertmanagers, use it
  if (storedUID && availableAlertmanagers.some((am) => am.uid === storedUID)) {
    return storedUID;
  }

  // Otherwise, use the first available alertmanager or fallback to default
  const firstAlertmanager = availableAlertmanagers.at(0);
  if (firstAlertmanager) {
    // Store it in sessionStorage for next time
    sessionStorage.setItem(STORAGE_KEYS.SELECTED_ALERTMANAGER_UID, firstAlertmanager.uid);
    return firstAlertmanager.uid;
  }

  // Fallback to default if no alertmanagers are configured
  throw new Error('no available Alertmanagers');
}

// Create the Redux store once outside the component tree
const store = createStore(getInitialDataSourceUID());

function App(_props: AppRootProps) {
  return (
    <StoreProvider store={store}>
      <Routes>
        <Route path={ROUTES.Routes} element={<RouteTree />} />
        <Route path={ROUTES.Rules} element={<Rules />} />
        <Route path={ROUTES.RuleView} element={<RuleDetails />} />
        <Route path={ROUTES.RuleEdit} element={<RuleEditor />} />
        <Route path={ROUTES.RuleNew} element={<RuleEditor />} />
        <Route path={`${ROUTES.Receivers}/:name`} element={<ReceiverDetail />} />
        <Route path={ROUTES.Receivers} element={<Receivers />} />
        <Route path={ROUTES.Templates} element={<Templates />} />
        <Route path={ROUTES.CreateSilence} element={<SilenceForm />} />
        <Route path={ROUTES.EditSilence} element={<SilenceForm />} />
        <Route path={ROUTES.Silences} element={<Silences />} />
        <Route path={ROUTES.CreateTimeInterval} element={<TimeIntervalForm />} />
        <Route path={`${ROUTES.TimeIntervals}/:name`} element={<TimeIntervalDetail />} />
        <Route path={ROUTES.TimeIntervals} element={<TimeIntervals />} />
        <Route path={ROUTES.InhibitRules} element={<InhibitRules />} />

        {/* Default page */}
        <Route path="*" element={<Landing />} />
      </Routes>
    </StoreProvider>
  );
}

export default App;
