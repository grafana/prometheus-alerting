import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { parseIdentifier, isCloudRuleIdentifier, CloudRuleIdentifier } from '@grafana/external-rules/identifiers';
import { getRuleName } from '@grafana/external-rules/utils';
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
import { PermissionDenied } from '../../../access-control/components/PermissionDenied';
import { AlertingAction, DeniedAbility, isAbilityAllowed, useScopedAbilities } from '../../../access-control/abilities';
import { RulesErrorAlert } from '../components/RulesErrorAlert';

type RuleEditorAction = 'edited' | 'cloned';

function getRuleEditorTitle(action: RuleEditorAction): string {
  return action === 'edited'
    ? t('alerting.rule-editor.edit-rule', 'Edit rule')
    : t('alerting.rule-editor.clone-rule', 'Clone rule');
}

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
      return <InvalidIdentifierPage title={getRuleEditorTitle('cloned')} />;
    }
    if (!isCloudRuleIdentifier(copyFromIdentifier)) {
      return <UnsupportedRuleTypePage title={getRuleEditorTitle('cloned')} action="cloned" />;
    }
    return <ScopedRuleEditor identifier={copyFromIdentifier} action="cloned" />;
  }

  if (ruleIdentifier) {
    if (!editRuleIdentifier) {
      return <InvalidIdentifierPage title={getRuleEditorTitle('edited')} />;
    }
    if (!isCloudRuleIdentifier(editRuleIdentifier)) {
      return <UnsupportedRuleTypePage title={getRuleEditorTitle('edited')} action="edited" />;
    }
    return <ScopedRuleEditor identifier={editRuleIdentifier} action="edited" />;
  }

  return <NewRuleEditor />;
}

/**
 * Gates editing an existing rule on the source data source's abilities.
 *
 * App layout routes require write permission for new rules and read + write for edits
 * before this component mounts. Scoped abilities only add datasource capability checks.
 */
function ScopedRuleEditor({ identifier, action }: { identifier: CloudRuleIdentifier; action: RuleEditorAction }) {
  const abilities = useScopedAbilities(identifier.uid);
  const alertingAction = action === 'cloned' ? AlertingAction.CreateRule : AlertingAction.UpdateRule;
  const ability = abilities[alertingAction];

  if (!isAbilityAllowed(ability)) {
    return <RuleEditorUnavailablePage ability={ability} identifier={identifier} action={action} />;
  }

  return action === 'cloned' ? <CloneRuleEditor identifier={identifier} /> : <EditRuleEditor identifier={identifier} />;
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

interface RuleEditorUnavailablePageProps {
  ability: DeniedAbility;
  identifier: CloudRuleIdentifier;
  action: RuleEditorAction;
}

function RuleEditorUnavailablePage({ ability, identifier, action }: RuleEditorUnavailablePageProps) {
  const title = getRuleEditorTitle(action);
  const pageNav = { text: title, ...buildRuleNavigation(identifier) };

  switch (ability.cause) {
    case 'LOADING':
      return <RuleLoadingPage pageNav={pageNav} />;
    case 'ERROR':
      return <RuleErrorPage pageNav={pageNav} error={ability.error} />;
    case 'NOT_SUPPORTED':
      return <UnsupportedRuleTypePage title={title} action={action} />;
    case 'INSUFFICIENT_PERMISSIONS':
      return <PermissionDenied />;
  }
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
    return <RuleLoadingPage pageNav={pageNav} />;
  }

  if (error) {
    return <RuleErrorPage pageNav={pageNav} error={error} />;
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
    return <RuleLoadingPage pageNav={pageNav} />;
  }

  if (error) {
    return <RuleErrorPage pageNav={pageNav} error={error} />;
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

function RuleLoadingPage({ pageNav }: { pageNav: NavModelItem }) {
  return (
    <PluginPage pageNav={pageNav}>
      <Alert severity="info" title={t('alerting.rule-editor.loading-rule', 'Loading rule...')}>
        {t('alerting.rule-editor.loading-description', 'Fetching rule details and configuration...')}
      </Alert>
    </PluginPage>
  );
}

function RuleErrorPage({ pageNav, error }: { pageNav: NavModelItem; error: unknown }) {
  return (
    <PluginPage pageNav={pageNav}>
      <RulesErrorAlert error={error} title={t('alerting.rule-editor.failed-to-load', 'Failed to load rule')} />
    </PluginPage>
  );
}

function UnsupportedRuleTypePage({ title, action }: { title: string; action: RuleEditorAction }) {
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
      <Alert severity="error" title={t('alerting.rule-editor.ruler-api-not-supported', 'Ruler API not supported')}>
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
