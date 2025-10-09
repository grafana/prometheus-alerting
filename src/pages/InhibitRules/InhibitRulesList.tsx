import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { testIds } from '../../components/testIds';
import { PluginPage } from '@grafana/runtime';
import { Alert, Card } from '@grafana/ui';
import { useInhibitRules } from '../../hooks/useInhibitRules';
import { css } from '@emotion/css';
import { Trans, t } from '@grafana/i18n';

function InhibitRulesPage() {
  const { inhibitRules, isLoading, error } = useInhibitRules();

  const cardStyle = css`
    margin-bottom: 10px;
  `;

  const listStyle = css`
    list-style: none;
    padding-left: 0;
    margin: 8px 0;
  `;

  const formatMatchers = (matchers?: string[]) => {
    if (!matchers || matchers.length === 0) {
      return t('inhibit-rules.no-matchers', 'None');
    }
    return matchers.join(', ');
  };

  return (
    <PluginPage>
      <div data-testid={testIds.inhibitRules.container}>
        {isLoading && (
          <div>
            <Skeleton height={50} style={{ marginBottom: '10px' }} />
            <Skeleton height={120} count={3} style={{ marginBottom: '5px' }} />
          </div>
        )}
        {error && (
          <Alert title={t('inhibit-rules.error-loading-title', 'Error loading inhibit rules')} severity="error">
            {error instanceof Error
              ? error.message
              : t('inhibit-rules.error-loading-message', 'Failed to fetch inhibit rules')}
          </Alert>
        )}
        {!isLoading && inhibitRules.length > 0 && (
          <div>
            {inhibitRules.map((rule, index) => (
              <div key={index} className={cardStyle}>
                <Card>
                  <Card.Heading>
                    <Trans i18nKey="inhibit-rules.rule-number" values={{ number: index + 1 }}>
                      Inhibit Rule {{ number: index + 1 }}
                    </Trans>
                  </Card.Heading>
                  <Card.Meta>
                    <ul className={listStyle}>
                      <li>
                        <strong>
                          <Trans i18nKey="inhibit-rules.source-matchers-label">Source Matchers:</Trans>
                        </strong>{' '}
                        {formatMatchers(rule.source_matchers)}
                      </li>
                      <li>
                        <strong>
                          <Trans i18nKey="inhibit-rules.target-matchers-label">Target Matchers:</Trans>
                        </strong>{' '}
                        {formatMatchers(rule.target_matchers)}
                      </li>
                      {rule.equal && rule.equal.length > 0 && (
                        <li>
                          <strong>
                            <Trans i18nKey="inhibit-rules.equal-label">Equal:</Trans>
                          </strong>{' '}
                          {rule.equal.join(', ')}
                        </li>
                      )}
                    </ul>
                  </Card.Meta>
                </Card>
              </div>
            ))}
          </div>
        )}
        {!isLoading && inhibitRules.length === 0 && !error && (
          <Alert title={t('inhibit-rules.no-rules-title', 'No inhibit rules found')} severity="info">
            <Trans i18nKey="inhibit-rules.no-rules-message">No inhibit rules are configured in the Alertmanager.</Trans>
          </Alert>
        )}
      </div>
    </PluginPage>
  );
}

export default InhibitRulesPage;
