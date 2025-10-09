import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { testIds } from '../../components/testIds';
import { PluginPage } from '@grafana/runtime';
import { Alert, Card } from '@grafana/ui';
import { useTemplates } from '../../hooks/useTemplates';
import { css } from '@emotion/css';
import { Trans, t } from '@grafana/i18n';

function TemplatesPage() {
  const { templates, isLoading, error } = useTemplates();

  const cardStyle = css`
    margin-bottom: 10px;
  `;

  const templatePathStyle = css`
    font-family: monospace;
    background-color: rgba(0, 0, 0, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
  `;

  return (
    <PluginPage>
      <div data-testid={testIds.templates.container}>
        {isLoading && (
          <div>
            <Skeleton height={50} style={{ marginBottom: '10px' }} />
            <Skeleton height={80} count={3} style={{ marginBottom: '5px' }} />
          </div>
        )}
        {error && (
          <Alert title={t('templates.error-loading-title', 'Error loading templates')} severity="error">
            {error instanceof Error ? error.message : t('templates.error-loading-message', 'Failed to fetch templates')}
          </Alert>
        )}
        {!isLoading && templates.length > 0 && (
          <div>
            {templates.map((template, index) => (
              <div key={index} className={cardStyle}>
                <Card>
                  <Card.Heading>
                    <Trans i18nKey="templates.template-number" values={{ number: index + 1 }}>
                      Template {{ number: index + 1 }}
                    </Trans>
                  </Card.Heading>
                  <Card.Meta>
                    <div>
                      <strong>
                        <Trans i18nKey="templates.path-label">Path:</Trans>
                      </strong>{' '}
                      <span className={templatePathStyle}>{template}</span>
                    </div>
                  </Card.Meta>
                </Card>
              </div>
            ))}
          </div>
        )}
        {!isLoading && templates.length === 0 && !error && (
          <Alert title={t('templates.no-templates-title', 'No templates found')} severity="info">
            <Trans i18nKey="templates.no-templates-message">No templates are configured in the Alertmanager.</Trans>
          </Alert>
        )}
      </div>
    </PluginPage>
  );
}

export default TemplatesPage;
