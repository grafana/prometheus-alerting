import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { ROUTES } from '../../constants';
import { DataSourceProvider } from '../../contexts/DataSourceContext';
import { StoreProvider } from '../StoreProvider/StoreProvider';

const Landing = React.lazy(() => import('../../pages/Landing'));
const Rules = React.lazy(() => import('../../pages/Rules/RulesList'));
const RouteTree = React.lazy(() => import('../../pages/Routes/RoutesList'));
const Receivers = React.lazy(() => import('../../pages/Receivers/ReceiversList'));
const Templates = React.lazy(() => import('../../pages/Templates/TemplatesList'));
const Silences = React.lazy(() => import('../../pages/Silences/SilencesList'));
const TimeIntervals = React.lazy(() => import('../../pages/TimeIntervals/TimeIntervalsList'));
const InhibitRules = React.lazy(() => import('../../pages/InhibitRules/InhibitRulesList'));

function App(_props: AppRootProps) {
  // TODO: Get this from query params or plugin configuration
  // For now, using a default value. You can update this to read from:
  // - URL query parameters
  // - Plugin meta configuration
  // - User selection from a dropdown
  const dataSourceUID = 'gdev-alertmanager';

  return (
    <DataSourceProvider dataSourceUID={dataSourceUID}>
      <StoreProvider>
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
    </DataSourceProvider>
  );
}

export default App;
