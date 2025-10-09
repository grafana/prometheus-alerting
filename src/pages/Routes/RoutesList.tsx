import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { testIds } from '../../components/testIds';
import { PluginPage } from '@grafana/runtime';
import { Alert, Card } from '@grafana/ui';
import { useRoutes } from '../../hooks/useRoutes';
import { css } from '@emotion/css';
import { Trans, t } from '@grafana/i18n';
import { AlertLabel } from '@grafana/alerting';

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
    padding-left: ${level * 8}px;
  `;

  const headerRowStyle = css`
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  `;

  const receiverStyle = css`
    font-weight: 500;
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
            <div>
              <span className={receiverStyle}>
                {route.receiver ? (
                  <Trans i18nKey="routes.receiver-label" values={{ receiver: route.receiver }}>
                    Receiver: {{ receiver: route.receiver }}
                  </Trans>
                ) : (
                  <Trans i18nKey="routes.route-label">Route</Trans>
                )}
              </span>
            </div>
            {route.matchers && route.matchers.length > 0 && (
              <div className={matchersContainerStyle}>
                {route.matchers.map((matcher, index) => (
                  <AlertLabel key={index} labelKey={matcher} colorBy="key" size="sm" />
                ))}
              </div>
            )}
          </div>
        </Card.Heading>
        <Card.Meta>
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

  return (
    <PluginPage>
      <div data-testid={testIds.routes.container}>
        {isLoading && (
          <div>
            <Skeleton height={50} style={{ marginBottom: '10px' }} />
            <Skeleton height={100} count={3} style={{ marginBottom: '5px' }} />
          </div>
        )}
        {error && (
          <Alert title={t('routes.error-loading-title', 'Error loading routes')} severity="error">
            {error instanceof Error ? error.message : t('routes.error-loading-message', 'Failed to fetch routes')}
          </Alert>
        )}
        {!isLoading && route && (
          <div>
            <RouteCard route={route} />
          </div>
        )}
        {!isLoading && !route && !error && (
          <Alert title={t('routes.no-routes-title', 'No routes found')} severity="info">
            <Trans i18nKey="routes.no-routes-message">No routing configuration is available in the Alertmanager.</Trans>
          </Alert>
        )}
      </div>
    </PluginPage>
  );
}

export default RoutesPage;
