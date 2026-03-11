import React from 'react';
import { t } from '@grafana/i18n';
import { Stack, Text } from '@grafana/ui';
import { DrawerWithFooter } from '../../../components/DrawerWithFooter';
import { InhibitRuleFormFields, type InhibitRuleFormData, formDataToInhibitRule } from './InhibitRuleFormFields';
import { useAddInhibitRule } from '../hooks/useInhibitRules';

interface InhibitRuleCreateDrawerProps {
  onClose: () => void;
}

export function InhibitRuleCreateDrawer({ onClose }: InhibitRuleCreateDrawerProps) {
  const [addInhibitRule, { isLoading: isCreating, error: createError }] = useAddInhibitRule();

  const handleCreate = async (data: InhibitRuleFormData) => {
    try {
      await addInhibitRule(formDataToInhibitRule(data));
      onClose();
    } catch (err) {
      // error is surfaced via createError
    }
  };

  return (
    <DrawerWithFooter
      title={
        <Stack direction="column" gap={0}>
          <Text variant="bodySmall" color="secondary">
            {t('inhibit-rules.create-drawer.subtitle', 'Inhibit Rule')}
          </Text>
          <Text variant="h2">{t('inhibit-rules.create-drawer.title', 'New Inhibit Rule')}</Text>
        </Stack>
      }
      onClose={onClose}
      size="sm"
    >
      <InhibitRuleFormFields onSubmit={handleCreate} onCancel={onClose} isLoading={isCreating} error={createError} />
    </DrawerWithFooter>
  );
}
