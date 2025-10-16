import React, { useMemo } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { testIds } from '../../../components/testIds';
import { Alert, Card, EmptyState, TextLink } from '@grafana/ui';
import { useRoutes } from '../hooks/useRoutes';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { css } from '@emotion/css';
import { Trans, t } from '@grafana/i18n';
import { AlertLabel } from '@grafana/alerting';
import { computeInheritedTree } from '@grafana/alerting/unstable';
import { ROUTES } from '../../../constants';
import { prefixRoute } from '../../../utils/utils.routing';

interface RouteConfig {
  receiver?: string;
  group_by?: string[];
  continue?: boolean;
  routes?: RouteConfig[];
  group_wait?: string;
  group_interval?: string;
  repeat_interval?: string;
  matchers?: string[];
}

function RouteCard({ route, level = 0 }: { route: RouteConfig; level?: number }) {
  const cardStyle = css`
    margin-bottom: 8px;
    margin-left: 16px;
  `;

  const headerRowStyle = css`
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  `;

  const matchersContainerStyle = css`
    flex: 1;
    min-width: 200px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  `;

  return (
    <div className={cardStyle}>
      <Card>
        <Card.Heading>
          <div className={headerRowStyle}>
            {route.matchers && route.matchers.length > 0 ? (
              <div className={matchersContainerStyle}>
                {route.matchers.map((matcher, index) => (
                  <AlertLabel key={index} value={matcher} colorBy="value" size="sm" />
                ))}
              </div>
            ) : (
              <Trans i18nKey="routes.route-label">Route</Trans>
            )}
          </div>
        </Card.Heading>
        <Card.Meta>
          {route.receiver && (
            <div>
              <strong>
                <Trans i18nKey="routes.receiver-label">Receiver:</Trans>
              </strong>{' '}
              <TextLink href={prefixRoute(`${ROUTES.Receivers}/${encodeURIComponent(route.receiver)}`)} inline={true}>
                {route.receiver}
              </TextLink>
            </div>
          )}
          {route.group_by && route.group_by.length > 0 && (
            <div>
              <strong>
                <Trans i18nKey="routes.group-by-label">Group by:</Trans>
              </strong>{' '}
              {route.group_by.join(', ')}
            </div>
          )}
          {route.group_wait && (
            <div>
              <strong>
                <Trans i18nKey="routes.group-wait-label">Group wait:</Trans>
              </strong>{' '}
              {route.group_wait}
            </div>
          )}
          {route.group_interval && (
            <div>
              <strong>
                <Trans i18nKey="routes.group-interval-label">Group interval:</Trans>
              </strong>{' '}
              {route.group_interval}
            </div>
          )}
          {route.repeat_interval && (
            <div>
              <strong>
                <Trans i18nKey="routes.repeat-interval-label">Repeat interval:</Trans>
              </strong>{' '}
              {route.repeat_interval}
            </div>
          )}
          {route.continue !== undefined && (
            <div>
              <strong>
                <Trans i18nKey="routes.continue-label">Continue:</Trans>
              </strong>{' '}
              {route.continue ? <Trans i18nKey="routes.yes">Yes</Trans> : <Trans i18nKey="routes.no">No</Trans>}
            </div>
          )}
        </Card.Meta>
      </Card>
      {route.routes && route.routes.length > 0 && (
        <div>
          {route.routes.map((childRoute, index) => (
            <RouteCard key={index} route={childRoute} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function RoutesPage() {
  const { route, isLoading, error } = useRoutes();

  // Compute the inherited tree to show all properties including inherited ones
  const inheritedRoute = useMemo(() => {
    if (!route) {
      return undefined;
    }
    return computeInheritedTree(route);
  }, [route]);

  return (
    <AlertmanagerPage
      subTitle={t('routes.page-subtitle', 'Determine how alerts are routed to contact points')}
    >
      <div data-testid={testIds.routes.container}>
        {isLoading && (
          <Skeleton height={100} count={3} />
        )}
        {error && (
          <Alert title={t('routes.error-loading-title', 'Error loading routes')} severity="error">
            {error instanceof Error ? error.message : t('routes.error-loading-message', 'Failed to fetch routes')}
          </Alert>
        )}
        {!isLoading && inheritedRoute && !error && (
          <div>
            <RouteCard route={inheritedRoute} />
          </div>
        )}
        {!isLoading && !route && !error && (
          <EmptyState
            message={t('routes.no-routes-message', 'No routing configuration is available in the Alertmanager.')}
            variant="call-to-action"
          />
        )}
      </div>
    </AlertmanagerPage>
  );
}

export default RoutesPage;
