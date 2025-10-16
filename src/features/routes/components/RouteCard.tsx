import React from 'react';
import { Card, TextLink } from '@grafana/ui';
import { css } from '@emotion/css';
import { Trans } from '@grafana/i18n';
import { AlertLabel } from '@grafana/alerting';
import { ROUTES } from '../../../constants';
import { prefixRoute } from '../../../utils/utils.routing';

export interface RouteConfig {
  receiver?: string;
  group_by?: string[];
  continue?: boolean;
  routes?: RouteConfig[];
  group_wait?: string;
  group_interval?: string;
  repeat_interval?: string;
  matchers?: string[];
}

interface RouteCardProps {
  route: RouteConfig;
  level?: number;
}

export function RouteCard({ route, level = 0 }: RouteCardProps) {
  const cardStyle = css`
    margin-bottom: 8px;
    margin-left: ${level * 16}px;
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
    <>
      <Card className={cardStyle}>
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
        <>
          {route.routes.map((childRoute, index) => (
            <RouteCard key={index} route={childRoute} level={level + 1} />
          ))}
        </>
      )}
    </>
  );
}
