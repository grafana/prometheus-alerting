import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { ROUTES } from '../../constants';

const Landing = React.lazy(() => import('../../pages/Landing'));
const Rules = React.lazy(() => import('../../pages/Rules/RulesList'));
const RouteTree = React.lazy(() => import('../../pages/Routes/RoutesList'));
const Receivers = React.lazy(() => import('../../pages/Receivers/ReceiversList'));
const Templates = React.lazy(() => import('../../pages/Templates/TemplatesList'));

function App(_props: AppRootProps) {
  return (
    <Routes>
      <Route path={ROUTES.Routes} element={<RouteTree />} />
      <Route path={ROUTES.Rules} element={<Rules />} />
      <Route path={`${ROUTES.Receivers}/:id?`} element={<Receivers />} />
      <Route path={ROUTES.Templates} element={<Templates />} />

      {/* Default page */}
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}

export default App;
