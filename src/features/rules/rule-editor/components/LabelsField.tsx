import React, { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { AlertLabels } from '@grafana/alerting/unstable';
import { t } from '@grafana/i18n';
import { Button, Stack, Text } from '@grafana/ui';

import { RuleFormValues, KVObject } from '../types';
import { isCloudAlertingRuleByType } from '../ruleTypeHelpers';
import { LabelsEditorModal } from './LabelsEditorModal';
import { RuleEditorSection } from './RuleEditorSection';

export const LabelsField = () => {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RuleFormValues>();
  const labels = watch('labels');
  const isAlerting = isCloudAlertingRuleByType(watch('type'));
  const [showModal, setShowModal] = useState(false);

  const templateSyntaxError = Array.isArray(errors.labels)
    ? errors.labels.find((labelError) => labelError?.value)?.value?.message
    : undefined;

  const nonEmptyLabels = labels.filter((label) => label.key.trim() !== '');

  // Convert KVObject array to Record<string, string> for AlertLabels component
  const labelsRecord = useMemo(() => {
    return nonEmptyLabels.reduce(
      (acc, label) => {
        acc[label.key] = label.value;
        return acc;
      },
      {} as Record<string, string>
    );
  }, [nonEmptyLabels]);

  const handleSaveLabels = (newLabels: KVObject[]) => {
    setValue('labels', newLabels);
    setShowModal(false);
  };

  return (
    <>
      <RuleEditorSection
        stepNo={3}
        title={t('alerting.labels-field.title-add-labels', 'Labels')}
        description={t('alerting.labels-field.description-labels', 'Add labels to help you better manage your rules.')}
      >
        <Stack direction="column" gap={1}>
          {nonEmptyLabels.length > 0 ? (
            <AlertLabels labels={labelsRecord} size="sm" />
          ) : (
            <Text variant="bodySmall" color="secondary">
              {t('alerting.labels-field.no-labels', 'No labels defined')}
            </Text>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={() => setShowModal(true)}>
            {nonEmptyLabels.length > 0
              ? t('alerting.labels-field.edit-labels', 'Edit labels')
              : t('alerting.labels-field.add-labels', 'Add labels')}
          </Button>
          {templateSyntaxError && (
            <Text variant="bodySmall" color="error">
              {templateSyntaxError}
            </Text>
          )}
        </Stack>
      </RuleEditorSection>

      {showModal && (
        <LabelsEditorModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveLabels}
          initialLabels={labels}
          checkTemplateSyntax={isAlerting}
        />
      )}
    </>
  );
};
