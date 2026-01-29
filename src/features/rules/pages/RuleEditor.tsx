import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { parseIdentifier, isCloudRuleIdentifier, CloudRuleIdentifier, getRuleName } from '@grafana/external-rules';
import type { NavModelItem } from '@grafana/data';

import { t } from '@grafana/i18n';
import { PluginPage } from '@grafana/runtime';
import { Alert } from '@grafana/ui';

import { RuleForm } from '../rule-editor/components/RuleForm';
import { translateRouteParamToRuleType } from '../rule-editor/formDefaults';
import { rulerRuleToFormValues } from '../rule-editor/formTransform';
import { useRulerRule } from '../hooks/useRulerRule';
import { RuleFormValues, RuleFormType } from '../rule-editor/types';
import { generateCopiedName } from '../rule-editor/duplicate';

export default function RuleEditor() {
  const { ruleIdentifier } = useParams<{ ruleIdentifier?: string }>();
  const [searchParams] = useSearchParams();
  const copyFromParam = searchParams.get('copyFrom');

  const { copyFromIdentifier, editRuleIdentifier } = useMemo(() => {
    return {
      copyFromIdentifier: copyFromParam ? parseIdentifier(copyFromParam, true) : null,
      editRuleIdentifier: ruleIdentifier ? parseIdentifier(ruleIdentifier, true) : null,
    };
  }, [copyFromParam, ruleIdentifier]);

  // Determine mode and render appropriate component
  if (copyFromParam) {
    if (!copyFromIdentifier) {
      return <InvalidIdentifierPage title={t('alerting.rule-editor.clone-rule', 'Clone rule')} />;
    }
    if (!isCloudRuleIdentifier(copyFromIdentifier)) {
      return <UnsupportedRuleTypePage title={t('alerting.rule-editor.clone-rule', 'Clone rule')} action="cloned" />;
    }
    return <CloneRuleEditor identifier={copyFromIdentifier} />;
  }

  if (ruleIdentifier) {
    if (!editRuleIdentifier) {
      return <InvalidIdentifierPage title={t('alerting.rule-editor.edit-rule', 'Edit rule')} />;
    }
    if (!isCloudRuleIdentifier(editRuleIdentifier)) {
      return <UnsupportedRuleTypePage title={t('alerting.rule-editor.edit-rule', 'Edit rule')} action="edited" />;
    }
    return <EditRuleEditor identifier={editRuleIdentifier} />;
  }

  return <NewRuleEditor />;
}

function NewRuleEditor() {
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') || 'alerting';
  const ruleType = translateRouteParamToRuleType(typeParam);

  const pageTitle =
    ruleType === RuleFormType.cloudRecording
      ? t('alerting.rule-editor.new-recording-rule', 'New recording rule')
      : t('alerting.rule-editor.new-alert-rule', 'New alert rule');

  return (
    <PluginPage pageNav={{ text: pageTitle }}>
      <RuleForm ruleType={ruleType} />
    </PluginPage>
  );
}

function EditRuleEditor({ identifier }: { identifier: CloudRuleIdentifier }) {
  const { rulerRule, loading, error } = useRulerRule(identifier);

  const ruleType = rulerRule
    ? 'alert' in rulerRule
      ? RuleFormType.cloudAlerting
      : RuleFormType.cloudRecording
    : RuleFormType.cloudAlerting;

  const pageTitle =
    rulerRule && 'alert' in rulerRule
      ? t('alerting.rule-editor.edit-alert-rule', 'Edit alert rule')
      : t('alerting.rule-editor.edit-recording-rule', 'Edit recording rule');

  const pageNav = useMemo(
    () => ({
      text: pageTitle,
      ...buildRuleNavigation(identifier),
    }),
    [pageTitle, identifier]
  );

  const prefill = useMemo((): Partial<RuleFormValues> | undefined => {
    if (!rulerRule) {
      return undefined;
    }

    try {
      return rulerRuleToFormValues(identifier.uid, identifier.namespace, identifier.groupName, rulerRule);
    } catch (error) {
      console.error('Failed to convert rule to form values:', error);
      return undefined;
    }
  }, [rulerRule, identifier]);

  if (loading) {
    return (
      <PluginPage pageNav={pageNav}>
        <Alert severity="info" title={t('alerting.rule-editor.loading-rule', 'Loading rule...')}>
          {t('alerting.rule-editor.loading-description', 'Fetching rule details and configuration...')}
        </Alert>
      </PluginPage>
    );
  }

  if (error) {
    return (
      <PluginPage pageNav={pageNav}>
        <Alert severity="error" title={t('alerting.rule-editor.failed-to-load', 'Failed to load rule')}>
          {JSON.stringify(error)}
        </Alert>
      </PluginPage>
    );
  }

  if (!rulerRule) {
    return (
      <PluginPage pageNav={pageNav}>
        <Alert severity="warning" title={t('alerting.rule-editor.rule-not-found', 'Rule not found')}>
          {t(
            'alerting.rule-editor.rule-not-found-edit-message',
            'The requested rule could not be found or does not support editing. Only rules with Ruler API support can be edited.'
          )}
        </Alert>
      </PluginPage>
    );
  }

  return (
    <PluginPage pageNav={pageNav}>
      <RuleForm ruleType={ruleType} prefill={prefill} existingRuleIdentifier={identifier} />
    </PluginPage>
  );
}

/**
 * CloneRuleEditor - Clones an existing rule
 */
function CloneRuleEditor({ identifier }: { identifier: CloudRuleIdentifier }) {
  const { rulerRule, rulerGroup, loading, error } = useRulerRule(identifier);

  const ruleType = rulerRule
    ? 'alert' in rulerRule
      ? RuleFormType.cloudAlerting
      : RuleFormType.cloudRecording
    : RuleFormType.cloudAlerting;

  const pageTitle =
    rulerRule && 'alert' in rulerRule
      ? t('alerting.rule-editor.clone-alert-rule', 'Clone alert rule')
      : t('alerting.rule-editor.clone-recording-rule', 'Clone recording rule');

  const pageNav = useMemo(
    () => ({
      text: pageTitle,
      ...buildRuleNavigation(identifier),
    }),
    [pageTitle, identifier]
  );

  const prefill = useMemo((): Partial<RuleFormValues> | undefined => {
    if (!rulerRule) {
      return undefined;
    }

    try {
      const formValues = rulerRuleToFormValues(identifier.uid, identifier.namespace, identifier.groupName, rulerRule);

      // Generate a unique name for the cloned rule
      const existingNames = rulerGroup?.rules.map(getRuleName) ?? [];
      formValues.name = generateCopiedName(formValues.name, existingNames);

      return formValues;
    } catch (error) {
      console.error('Failed to convert rule to form values:', error);
      return undefined;
    }
  }, [rulerRule, rulerGroup, identifier]);

  if (loading) {
    return (
      <PluginPage pageNav={pageNav}>
        <Alert severity="info" title={t('alerting.rule-editor.loading-rule', 'Loading rule...')}>
          {t('alerting.rule-editor.loading-description', 'Fetching rule details and configuration...')}
        </Alert>
      </PluginPage>
    );
  }

  if (error) {
    return (
      <PluginPage pageNav={pageNav}>
        <Alert severity="error" title={t('alerting.rule-editor.failed-to-load', 'Failed to load rule')}>
          {JSON.stringify(error)}
        </Alert>
      </PluginPage>
    );
  }

  if (!rulerRule) {
    return (
      <PluginPage pageNav={pageNav}>
        <Alert severity="warning" title={t('alerting.rule-editor.rule-not-found', 'Rule not found')}>
          {t(
            'alerting.rule-editor.rule-not-found-clone-message',
            'The requested rule could not be found or does not support cloning. Only rules with Ruler API support can be cloned.'
          )}
        </Alert>
      </PluginPage>
    );
  }

  return (
    <PluginPage pageNav={pageNav}>
      <RuleForm ruleType={ruleType} prefill={prefill} />
    </PluginPage>
  );
}

function InvalidIdentifierPage({ title }: { title: string }) {
  return (
    <PluginPage pageNav={{ text: title }}>
      <Alert severity="error" title={t('alerting.rule-editor.invalid-identifier', 'Invalid rule identifier')}>
        {t('alerting.rule-editor.invalid-identifier-message', 'The rule identifier format is invalid.')}
      </Alert>
    </PluginPage>
  );
}

function UnsupportedRuleTypePage({ title, action }: { title: string; action: 'edited' | 'cloned' }) {
  const message =
    action === 'edited'
      ? t(
          'alerting.rule-editor.only-cloud-rules-editable',
          'Editing rules is only available for data sources with Ruler API.'
        )
      : t(
          'alerting.rule-editor.only-cloud-rules-cloneable',
          'Cloning rules is only available for data sources with Ruler API.'
        );

  return (
    <PluginPage pageNav={{ text: title }}>
      <Alert severity="error" title={t('alerting.rule-editor.unsupported-rule-type', 'Unsupported rule type')}>
        {message}
      </Alert>
    </PluginPage>
  );
}

function buildRuleNavigation(identifier: CloudRuleIdentifier): Partial<NavModelItem> {
  return {
    parentItem: {
      text: identifier.groupName,
      parentItem: {
        text: identifier.namespace,
        parentItem: {
          text: t('alerting.rule-editor.rules', 'Rules'),
          url: '/a/grafana-prometheusalerting-app/rules',
        },
      },
    },
  };
}
