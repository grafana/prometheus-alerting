import React, { useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { SkeletonTheme } from 'react-loading-skeleton';
import { ROUTES } from '../../constants';
import { StoreProvider } from '../StoreProvider/StoreProvider';
import { sharedStore } from '../../store/store';
import { AlertingPermission } from '../../access-control/abilities';
import { ProtectedRoute } from '../../access-control/components/ProtectedRoute';
import { RequireAlertmanager } from '../RequireAlertmanager';
import { useAvailableAlertmanagers } from '../../hooks/useAvailableAlertmanager';
import { getExternalRulesSources } from '../../utils/datasource';

const Alerts = React.lazy(() => import('../../features/alerts/pages/Alerts'));
const Rules = React.lazy(() => import('../../features/rules/pages/RulesList'));
const RuleDetails = React.lazy(() => import('../../features/rules/pages/RuleDetails'));
const RuleEditor = React.lazy(() => import('../../features/rules/pages/RuleEditor'));
const GroupDetails = React.lazy(() => import('../../features/rules/pages/GroupDetails'));
const GroupEditPage = React.lazy(() => import('../../features/rules/pages/GroupEditPage'));
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

function App(_props: AppRootProps) {
  const theme = useTheme2();
  const hasAlertmanager = useAvailableAlertmanagers().length > 0;
  const hasRulesSource = useMemo(() => getExternalRulesSources().length > 0, []);

  // Alerts is the natural landing page, but without an Alertmanager it can only show an empty state – send
  // those instances to the rules list instead, which works off Prometheus / Mimir. If rules have nowhere to
  // come from either, stay on alerts: its "no Alertmanager configured" page explains the situation best.
  const landingRoute = !hasAlertmanager && hasRulesSource ? ROUTES.Rules : ROUTES.Alerts;

  return (
    <StoreProvider store={sharedStore}>
      <SkeletonTheme
        baseColor={theme.colors.background.secondary}
        highlightColor={theme.colors.emphasize(theme.colors.background.secondary, 0.03)}
      >
        <Routes>
          <Route path="/" element={<Navigate to={landingRoute} replace />} />
          {/* Rule pages read from Prometheus / Mimir, so they work without any Alertmanager data source. */}
          <Route element={<ProtectedRoute requirements={[AlertingPermission.RulesRead]} />}>
            <Route path={ROUTES.Rules} element={<Rules />} />
            <Route path={ROUTES.RuleView} element={<RuleDetails />} />
            <Route path={ROUTES.GroupView} element={<GroupDetails />} />
          </Route>
          <Route
            element={<ProtectedRoute requirements={[AlertingPermission.RulesRead, AlertingPermission.RulesWrite]} />}
          >
            <Route path={ROUTES.RuleEdit} element={<RuleEditor />} />
            <Route path={ROUTES.GroupEdit} element={<GroupEditPage />} />
          </Route>
          <Route element={<ProtectedRoute requirements={[AlertingPermission.RulesWrite]} />}>
            <Route path={ROUTES.RuleNew} element={<RuleEditor />} />
          </Route>
          {/* Everything below queries an Alertmanager, so it needs at least one configured. */}
          <Route element={<RequireAlertmanager />}>
            <Route path={ROUTES.Alerts} element={<Alerts />} />
            <Route element={<ProtectedRoute requirements={[AlertingPermission.NotificationsRead]} />}>
              <Route path={ROUTES.Routes} element={<RouteTree />} />
              <Route path={`${ROUTES.Receivers}/:name`} element={<ReceiverDetail />} />
              <Route path={ROUTES.Receivers} element={<Receivers />} />
            </Route>
            <Route path={ROUTES.Templates} element={<Templates />} />
            <Route path={ROUTES.CreateSilence} element={<SilenceForm />} />
            <Route path={ROUTES.Silences} element={<Silences />} />
            <Route path={ROUTES.CreateTimeInterval} element={<TimeIntervalForm />} />
            <Route path={`${ROUTES.TimeIntervals}/:name`} element={<TimeIntervalDetail />} />
            <Route path={ROUTES.TimeIntervals} element={<TimeIntervals />} />
            <Route path={ROUTES.InhibitRules} element={<InhibitRules />} />
          </Route>
        </Routes>
      </SkeletonTheme>
    </StoreProvider>
  );
}

export default App;
