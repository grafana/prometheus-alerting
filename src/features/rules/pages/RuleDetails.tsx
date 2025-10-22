import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { parseIdentifier } from '@grafana/external-rules';
import { Alert, LoadingPlaceholder } from '@grafana/ui';
import { t } from '@grafana/i18n';

import { useRuleDetails } from '../hooks/useRuleDetails';
import { RuleDetailsView } from '../components/RuleDetailsView';

function RuleDetails() {
  const { ruleIdentifier } = useParams<{ ruleIdentifier: string }>();

  const identifier = useMemo(() => {
    if (!ruleIdentifier) {
      throw new Error('Rule identifier is required');
    }
    const parsed = parseIdentifier(ruleIdentifier, true);
    if (!parsed) {
      throw new Error('Invalid rule identifier format');
    }
    return parsed;
  }, [ruleIdentifier]);

  const { promRule, rulerRule, promGroup, rulerGroup, loading, error, ...meta } = useRuleDetails(identifier);

  if (loading) {
    return <LoadingPlaceholder text={t('rule-details.loading', 'Loading rule details...')} />;
  }

  if (error) {
    return (
      <Alert severity="error" title={t('rule-details.error.loading', 'Error loading rule')}>
        {String(error)}
      </Alert>
    );
  }

  if (!promRule) {
    return (
      <Alert severity="warning" title={t('rule-details.error.not-found', 'Rule not found')}>
        {t('rule-details.error.not-found-message', 'The requested rule could not be found.')}
      </Alert>
    );
  }

  return (
    <RuleDetailsView
      promRule={promRule}
      rulerRule={rulerRule}
      promGroup={promGroup}
      rulerGroup={rulerGroup}
      {...meta}
    />
  );
}

export default RuleDetails;
