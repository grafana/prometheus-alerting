import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { parseIdentifier, DataSourceRuleIdentifier, isCloudRuleIdentifier } from '@grafana/external-rules';

import { t } from '@grafana/i18n';
import { PluginPage } from '@grafana/runtime';
import { Alert, LoadingPlaceholder } from '@grafana/ui';

import { RuleForm } from '../rule-editor/components/RuleForm';
import { translateRouteParamToRuleType } from '../rule-editor/formDefaults';
import { rulerRuleToFormValues } from '../rule-editor/formTransform';
import { useRuleDetails } from '../hooks/useRuleDetails';
import { RuleFormValues, RuleFormType } from '../rule-editor/types';

// TODO: Add access control checks

/**
 * NewRuleEditor - Creates a new rule from scratch
 */
function NewRuleEditor() {
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') || 'alerting';
  const ruleType = translateRouteParamToRuleType(typeParam);

  const pageTitle =
    ruleType === RuleFormType.cloudRecording
      ? t('alerting.rule-editor.new-recording-rule', 'New recording rule')
      : t('alerting.rule-editor.new-alert-rule', 'New alert rule');

  return (
    <PluginPage
      pageNav={{
        text: pageTitle,
      }}
    >
      <RuleForm ruleType={ruleType} />
    </PluginPage>
  );
}

/**
 * EditRuleEditor - Edits an existing rule
 */
function EditRuleEditor({ ruleIdentifier }: { ruleIdentifier: string }) {
  const identifier = useMemo(() => {
    try {
      return parseIdentifier(ruleIdentifier, true);
    } catch (error) {
      console.error('Failed to parse rule identifier:', error);
      return null;
    }
  }, [ruleIdentifier]);

  if (!identifier) {
    return (
      <PluginPage
        pageNav={{
          text: t('alerting.rule-editor.edit-rule', 'Edit rule'),
        }}
      >
        <Alert severity="error" title={t('alerting.rule-editor.invalid-identifier', 'Invalid rule identifier')}>
          {t('alerting.rule-editor.invalid-identifier-message', 'The rule identifier format is invalid.')}
        </Alert>
      </PluginPage>
    );
  }

  return <EditRuleEditorWithIdentifier identifier={identifier} />;
}

function EditRuleEditorWithIdentifier({ identifier }: { identifier: DataSourceRuleIdentifier }) {
  // Only cloud rules (data source managed) can be edited
  if (!isCloudRuleIdentifier(identifier)) {
    return (
      <PluginPage
        pageNav={{
          text: t('alerting.rule-editor.edit-rule', 'Edit rule'),
        }}
      >
        <Alert severity="error" title={t('alerting.rule-editor.unsupported-rule-type', 'Unsupported rule type')}>
          {t(
            'alerting.rule-editor.only-cloud-rules-editable',
            'Only data source managed rules can be edited in this plugin.'
          )}
        </Alert>
      </PluginPage>
    );
  }

  const { promRule, rulerRule, loading, error, ...meta } = useRuleDetails(identifier);

  const ruleType = rulerRule
    ? 'alert' in rulerRule
      ? RuleFormType.cloudAlerting
      : RuleFormType.cloudRecording
    : RuleFormType.cloudAlerting;

  const pageTitle =
    rulerRule && 'alert' in rulerRule
      ? t('alerting.rule-editor.edit-alert-rule', 'Edit alert rule')
      : t('alerting.rule-editor.edit-recording-rule', 'Edit recording rule');

  const prefill = useMemo((): Partial<RuleFormValues> | undefined => {
    if (!rulerRule) {
      return undefined;
    }

    try {
      return rulerRuleToFormValues(meta.dataSourceUid, meta.namespace, meta.groupName, rulerRule);
    } catch (error) {
      console.error('Failed to convert rule to form values:', error);
      return undefined;
    }
  }, [rulerRule, meta]);

  if (loading) {
    return (
      <PluginPage
        pageNav={{
          text: t('alerting.rule-editor.edit-rule', 'Edit rule'),
        }}
      >
        <LoadingPlaceholder text={t('alerting.rule-editor.loading-rule', 'Loading rule...')} />
      </PluginPage>
    );
  }

  if (error) {
    return (
      <PluginPage
        pageNav={{
          text: t('alerting.rule-editor.edit-rule', 'Edit rule'),
        }}
      >
        <Alert severity="error" title={t('alerting.rule-editor.failed-to-load', 'Failed to load rule')}>
          {String(error)}
        </Alert>
      </PluginPage>
    );
  }

  if (!rulerRule) {
    return (
      <PluginPage
        pageNav={{
          text: t('alerting.rule-editor.edit-rule', 'Edit rule'),
        }}
      >
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
    <PluginPage
      pageNav={{
        text: pageTitle,
      }}
    >
      <RuleForm
        ruleType={ruleType}
        prefill={prefill}
        dataSourceUid={meta.dataSourceUid}
        existingRuleIdentifier={identifier}
      />
    </PluginPage>
  );
}

/**
 * CloneRuleEditor - Clones an existing rule
 */
function CloneRuleEditor({ copyFrom }: { copyFrom: string }) {
  const identifier = useMemo(() => {
    try {
      return parseIdentifier(copyFrom, true);
    } catch (error) {
      console.error('Failed to parse rule identifier:', error);
      return null;
    }
  }, [copyFrom]);

  if (!identifier) {
    return (
      <PluginPage
        pageNav={{
          text: t('alerting.rule-editor.clone-rule', 'Clone rule'),
        }}
      >
        <Alert severity="error" title={t('alerting.rule-editor.invalid-identifier', 'Invalid rule identifier')}>
          {t('alerting.rule-editor.invalid-identifier-message', 'The rule identifier format is invalid.')}
        </Alert>
      </PluginPage>
    );
  }

  return <CloneRuleEditorWithIdentifier identifier={identifier} />;
}

function CloneRuleEditorWithIdentifier({ identifier }: { identifier: DataSourceRuleIdentifier }) {
  // Only cloud rules (data source managed) can be cloned
  if (!isCloudRuleIdentifier(identifier)) {
    return (
      <PluginPage
        pageNav={{
          text: t('alerting.rule-editor.clone-rule', 'Clone rule'),
        }}
      >
        <Alert severity="error" title={t('alerting.rule-editor.unsupported-rule-type', 'Unsupported rule type')}>
          {t(
            'alerting.rule-editor.only-cloud-rules-cloneable',
            'Only data source managed rules can be cloned in this plugin.'
          )}
        </Alert>
      </PluginPage>
    );
  }

  const { promRule, rulerRule, loading, error, ...meta } = useRuleDetails(identifier);

  const ruleType = rulerRule
    ? 'alert' in rulerRule
      ? RuleFormType.cloudAlerting
      : RuleFormType.cloudRecording
    : RuleFormType.cloudAlerting;

  const pageTitle =
    rulerRule && 'alert' in rulerRule
      ? t('alerting.rule-editor.clone-alert-rule', 'Clone alert rule')
      : t('alerting.rule-editor.clone-recording-rule', 'Clone recording rule');

  const prefill = useMemo((): Partial<RuleFormValues> | undefined => {
    if (!rulerRule) {
      return undefined;
    }

    try {
      const formValues = rulerRuleToFormValues(meta.dataSourceUid, meta.namespace, meta.groupName, rulerRule);
      // Append (copy) to the name for cloned rules
      formValues.name = `${formValues.name} (copy)`;
      return formValues;
    } catch (error) {
      console.error('Failed to convert rule to form values:', error);
      return undefined;
    }
  }, [rulerRule, meta]);

  if (loading) {
    return (
      <PluginPage
        pageNav={{
          text: t('alerting.rule-editor.clone-rule', 'Clone rule'),
        }}
      >
        <LoadingPlaceholder text={t('alerting.rule-editor.loading-rule', 'Loading rule...')} />
      </PluginPage>
    );
  }

  if (error) {
    return (
      <PluginPage
        pageNav={{
          text: t('alerting.rule-editor.clone-rule', 'Clone rule'),
        }}
      >
        <Alert severity="error" title={t('alerting.rule-editor.failed-to-load', 'Failed to load rule')}>
          {String(error)}
        </Alert>
      </PluginPage>
    );
  }

  if (!rulerRule) {
    return (
      <PluginPage
        pageNav={{
          text: t('alerting.rule-editor.clone-rule', 'Clone rule'),
        }}
      >
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
    <PluginPage
      pageNav={{
        text: pageTitle,
      }}
    >
      <RuleForm ruleType={ruleType} prefill={prefill} dataSourceUid={meta.dataSourceUid} />
    </PluginPage>
  );
}

/**
 * RuleEditor - Main router component that determines which editor to show
 */
function RuleEditor() {
  const { ruleIdentifier } = useParams<{ ruleIdentifier?: string }>();
  const [searchParams] = useSearchParams();
  const copyFromParam = searchParams.get('copyFrom');

  // Determine mode and render appropriate component
  if (copyFromParam) {
    return <CloneRuleEditor copyFrom={copyFromParam} />;
  }

  if (ruleIdentifier) {
    return <EditRuleEditor ruleIdentifier={ruleIdentifier} />;
  }

  return <NewRuleEditor />;
}

export default RuleEditor;
