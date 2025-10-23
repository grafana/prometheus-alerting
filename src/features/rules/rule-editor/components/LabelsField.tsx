import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { t } from '@grafana/i18n';
import { Button, Stack, Text } from '@grafana/ui';

import { RuleFormValues, KVObject } from '../types';
import { LabelsEditorModal } from './LabelsEditorModal';
import { RuleEditorSection } from './RuleEditorSection';

export const LabelsField = () => {
  const { watch, setValue } = useFormContext<RuleFormValues>();
  const labels = watch('labels');
  const [showModal, setShowModal] = useState(false);

  const nonEmptyLabels = labels.filter((label) => label.key.trim() !== '');

  const handleSaveLabels = (newLabels: KVObject[]) => {
    setValue('labels', newLabels);
    setShowModal(false);
  };

  return (
    <>
      <RuleEditorSection
        stepNo={4}
        title={t('alerting.labels-field.title-add-labels', 'Add labels')}
        description={t('alerting.labels-field.description-labels', 'Add labels to help you better manage your rules.')}
      >
        <Stack direction="column" gap={1}>
          {nonEmptyLabels.length > 0 ? (
            <Stack direction="column" gap={0.5}>
              {nonEmptyLabels.map((label, idx) => (
                <Text key={idx} variant="bodySmall">
                  <strong>{label.key}:</strong> {label.value}
                </Text>
              ))}
            </Stack>
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
        </Stack>
      </RuleEditorSection>

      {showModal && (
        <LabelsEditorModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveLabels}
          initialLabels={labels}
        />
      )}
    </>
  );
};
