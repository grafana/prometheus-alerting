import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { parseIdentifier, DataSourceRuleIdentifier } from '@grafana/external-rules';
import { Alert, LoadingPlaceholder } from '@grafana/ui';
import { PluginPage } from '@grafana/runtime';
import { t } from '@grafana/i18n';

import { useRuleDetails } from '../hooks/useRuleDetails';
import { RuleDetailsView } from '../components/RuleDetailsView';
import { RuleActionsButtons } from '../list/components/RuleActionsButtons';
import { useDeleteRuleModal } from '../list/components/DeleteRuleModal';
import { rules as rulesNav, groups as groupsNav } from '../../../utils/navigation';
import { DataSourceRuleGroupIdentifier } from '../../../types/rules';

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

  const [deleteModal, showDeleteModal] = useDeleteRuleModal();

  const handleDuplicate = (identifier: DataSourceRuleIdentifier) => {
    const cloneUrl = rulesNav.clonePageLink(identifier);
    window.location.href = cloneUrl;
  };

  const pageNav = useMemo(() => {
    if (!promRule) {
      return undefined;
    }
    return {
      text: promRule.name,
      parentItem: {
        text: meta.groupName,
        url: groupsNav.detailsPageLink(meta.dataSourceUid, meta.namespace, meta.groupName),
        parentItem: {
          text: meta.namespace,
          parentItem: {
            text: t('alerting.rule-editor.rules', 'Rules'),
            url: '/a/grafana-prometheusalerting-app/rules',
          },
        },
      },
    };
  }, [promRule, meta.groupName, meta.namespace, meta.dataSourceUid]);

  if (loading) {
    return (
      <PluginPage>
        <LoadingPlaceholder text={t('rule-details.loading', 'Loading rule details...')} />
      </PluginPage>
    );
  }

  if (error) {
    return (
      <PluginPage>
        <Alert severity="error" title={t('rule-details.error.loading', 'Error loading rule')}>
          {String(error)}
        </Alert>
      </PluginPage>
    );
  }

  if (!promRule) {
    return (
      <PluginPage
        pageNav={{
          text: t('rule-details.error.not-found', 'Rule not found'),
        }}
      >
        <Alert severity="warning" title={t('rule-details.error.not-found', 'Rule not found')}>
          {t('rule-details.error.not-found-message', 'The requested rule could not be found.')}
        </Alert>
      </PluginPage>
    );
  }

  // Setup group identifier for actions
  const groupIdentifier: DataSourceRuleGroupIdentifier = {
    rulesSource: {
      uid: meta.dataSourceUid,
      name: '',
      ruleSourceType: 'datasource',
    },
    namespace: {
      name: meta.namespace,
    },
    groupName: meta.groupName,
    groupOrigin: 'datasource',
  };

  // Prepare subTitle with state badge
  const subTitle =
    promRule.type === 'alerting'
      ? `State: ${promRule.state}${promRule.health ? ` (${promRule.health})` : ''}`
      : 'Recording Rule';

  // Prepare actions
  const actions = (
    <RuleActionsButtons
      rule={rulerRule}
      promRule={promRule}
      groupIdentifier={groupIdentifier}
      rulerApiEnabled={meta.hasRulerApi}
      onDelete={showDeleteModal}
      onDuplicate={handleDuplicate}
    />
  );

  return (
    <>
      <PluginPage pageNav={pageNav} subTitle={subTitle} actions={actions}>
        <RuleDetailsView
          promRule={promRule}
          rulerRule={rulerRule}
          promGroup={promGroup}
          rulerGroup={rulerGroup}
          {...meta}
        />
      </PluginPage>
      {deleteModal}
    </>
  );
}

export default RuleDetails;
