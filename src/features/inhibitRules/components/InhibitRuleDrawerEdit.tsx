import React from 'react';
import { t } from '@grafana/i18n';
import type { NormalizedInhibitRule } from '@grafana/external-alertmanager/vanilla';
import { useUpdateInhibitRule } from '../hooks/useInhibitRules';
import { InhibitRuleFormFields } from './InhibitRuleFormFields';
import { type InhibitRuleFormData, formDataToInhibitRule } from './InhibitRuleFormModel';

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
  return (
    <InhibitRuleFormFields
      inhibitRule={inhibitRule}
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
