import React from 'react';
import { t } from '@grafana/i18n';
import type { NormalizedInhibitRule } from '@grafana/external-alertmanager/vanilla';
import { useUpdateInhibitRule } from '../hooks/useInhibitRules';
import { InhibitRuleFormFields, type InhibitRuleFormData, formDataToInhibitRule } from './InhibitRuleFormFields';

interface InhibitRuleDrawerEditProps {
  inhibitRule: NormalizedInhibitRule;
  inhibitRuleIndex: number;
  onCancel: () => void;
  onSuccess: () => void;
}

export function InhibitRuleDrawerEdit({
  inhibitRule,
  inhibitRuleIndex,
  onCancel,
  onSuccess,
}: InhibitRuleDrawerEditProps) {
  const [updateInhibitRule, { isLoading: isUpdating, error: updateError }] = useUpdateInhibitRule();

  const handleSave = async (data: InhibitRuleFormData) => {
    try {
      await updateInhibitRule(formDataToInhibitRule(data), inhibitRuleIndex);
      onSuccess();
    } catch (err) {
      // error is surfaced via updateError
    }
  };

  // Convert NormalizedInhibitRule (ObjectMatcher[]) back to InhibitRule (string[]) for the form
  const inhibitRuleForForm = {
    source_matchers: inhibitRule.source_matchers.map(([name, op, value]) => `${name} ${op} ${value}`),
    target_matchers: inhibitRule.target_matchers.map(([name, op, value]) => `${name} ${op} ${value}`),
    equal: inhibitRule.equal,
  };

  return (
    <InhibitRuleFormFields
      inhibitRule={inhibitRuleForForm}
      onSubmit={handleSave}
      onCancel={onCancel}
      isLoading={isUpdating}
      error={updateError}
      submitButtonText={
        isUpdating
          ? t('inhibit-rules.drawer.edit.updating', 'Updating...')
          : t('inhibit-rules.drawer.edit.update-button', 'Update')
      }
      cancelButtonText={t('inhibit-rules.drawer.edit.cancel-button', 'Cancel')}
    />
  );
}
