import React, { useState } from 'react';
import { t } from '@grafana/i18n';
import { type NormalizedInhibitRule } from '@grafana/external-alertmanager/vanilla';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { InhibitRuleDrawerView, InhibitRuleDrawerViewFooter } from './InhibitRuleDrawerView';
import { InhibitRuleDrawerEdit } from './InhibitRuleDrawerEdit';
import { useDeleteInhibitRule } from '../hooks/useInhibitRules';
import { isAbilityAllowed } from '../../../access-control/abilities';
import { useAlertmanagerConfigMutationAbility } from '../../../hooks/useAlertmanagerConfigMutationAbility';

interface InhibitRuleDrawerProps {
  inhibitRule: NormalizedInhibitRule | null;
  inhibitRuleIndex: number | null;
  onClose: () => void;
}

export function InhibitRuleDrawer({ inhibitRule, inhibitRuleIndex, onClose }: InhibitRuleDrawerProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const canMutateInhibitRules = isAbilityAllowed(useAlertmanagerConfigMutationAbility());
  const [deleteInhibitRule, { isLoading: isDeleting, error: deleteError }] = useDeleteInhibitRule();

  if (!inhibitRule || inhibitRuleIndex === null) {
    return null;
  }

  const handleDelete = async () => {
    await deleteInhibitRule(inhibitRuleIndex);
    onClose();
  };

  return (
    <DrawerWithFooter
      title={t('inhibit-rules.drawer.title', 'Inhibit Rule')}
      onClose={onClose}
      size="md"
      footer={
        !isEditMode && canMutateInhibitRules ? (
          <InhibitRuleDrawerViewFooter
            onEdit={() => setIsEditMode(true)}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        ) : undefined
      }
    >
      {isEditMode ? (
        <InhibitRuleDrawerEdit
          inhibitRule={inhibitRule}
          inhibitRuleIndex={inhibitRuleIndex}
          onCancel={() => setIsEditMode(false)}
          onSuccess={() => {
            setIsEditMode(false);
            onClose();
          }}
        />
      ) : (
        <InhibitRuleDrawerView inhibitRule={inhibitRule} deleteError={deleteError} />
      )}
    </DrawerWithFooter>
  );
}
