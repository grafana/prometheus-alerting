import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { parseIdentifier, DataSourceRuleIdentifier, isCloudRuleIdentifier } from '@grafana/external-rules';

import { t } from '@grafana/i18n';
import { PluginPage } from '@grafana/runtime';
import { Alert, Button, Stack } from '@grafana/ui';

import { RuleForm } from '../rule-editor/components/RuleForm';
import { translateRouteParamToRuleType } from '../rule-editor/formDefaults';
import { rulerRuleToFormValues } from '../rule-editor/formTransform';
import { useRuleDetails } from '../hooks/useRuleDetails';
import { RuleFormValues, RuleFormType } from '../rule-editor/types';

// TODO: Add access control checks

/**
 * RuleFormSkeleton - Loading skeleton for the rule form
 */
function RuleFormSkeleton() {
  return (
    <Stack direction="column" gap={3}>
      {/* Simplified loading state - just show informative message */}
      <Alert severity="info" title={t('alerting.rule-editor.loading-sections', 'Loading form sections...')}>
        {t('alerting.rule-editor.loading-sections-desc', 'Preparing the rule editor form...')}
      </Alert>
    </Stack>
  );
}

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
  // Check if this is a cloud rule - do this before hooks
  const isCloudRule = isCloudRuleIdentifier(identifier);

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

  // Only cloud rules can be edited
  if (!isCloudRule) {
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

  if (loading) {
    return (
      <PluginPage
        pageNav={{
          text: t('alerting.rule-editor.edit-rule', 'Edit rule'),
        }}
      >
        <Stack direction="column" gap={2}>
          <Alert severity="info" title={t('alerting.rule-editor.loading-rule', 'Loading rule...')}>
            {t('alerting.rule-editor.loading-description', 'Fetching rule details and configuration...')}
          </Alert>
          <RuleFormSkeleton />
        </Stack>
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
          <Stack direction="column" gap={2}>
            <div>{String(error)}</div>
            <Stack direction="row" gap={1}>
              <Button variant="secondary" size="sm" onClick={() => window.location.reload()} icon="sync">
                {t('alerting.rule-editor.retry', 'Retry')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => window.history.back()} icon="arrow-left">
                {t('alerting.rule-editor.go-back', 'Go back')}
              </Button>
            </Stack>
          </Stack>
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
        parentItem: {
          text: meta.groupName,
          parentItem: {
            text: meta.namespace,
            parentItem: {
              text: t('alerting.rule-editor.rules', 'Rules'),
              url: '/a/grafana-prometheusalerting-app/rules',
            },
          },
        },
      }}
    >
      <RuleForm ruleType={ruleType} prefill={prefill} existingRuleIdentifier={identifier} />
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
  // Check if this is a cloud rule - do this before hooks
  const isCloudRule = isCloudRuleIdentifier(identifier);

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

  // Only cloud rules can be cloned
  if (!isCloudRule) {
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

  if (loading) {
    return (
      <PluginPage
        pageNav={{
          text: t('alerting.rule-editor.clone-rule', 'Clone rule'),
        }}
      >
        <Stack direction="column" gap={2}>
          <Alert severity="info" title={t('alerting.rule-editor.loading-rule', 'Loading rule...')}>
            {t('alerting.rule-editor.loading-description', 'Fetching rule details and configuration...')}
          </Alert>
          <RuleFormSkeleton />
        </Stack>
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
          <Stack direction="column" gap={2}>
            <div>{String(error)}</div>
            <Stack direction="row" gap={1}>
              <Button variant="secondary" size="sm" onClick={() => window.location.reload()} icon="sync">
                {t('alerting.rule-editor.retry', 'Retry')}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => window.history.back()} icon="arrow-left">
                {t('alerting.rule-editor.go-back', 'Go back')}
              </Button>
            </Stack>
          </Stack>
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
        parentItem: {
          text: meta.groupName,
          parentItem: {
            text: meta.namespace,
            parentItem: {
              text: t('alerting.rule-editor.rules', 'Rules'),
              url: '/a/grafana-prometheusalerting-app/rules',
            },
          },
        },
      }}
    >
      <RuleForm ruleType={ruleType} prefill={prefill} />
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
