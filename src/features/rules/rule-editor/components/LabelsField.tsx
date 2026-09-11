import React, { useMemo, useState } from 'react';
import { FieldErrors, useFormContext } from 'react-hook-form';

import { AlertLabels } from '@grafana/alerting/unstable';
import { t } from '@grafana/i18n';
import { Button, Field, Stack, Text } from '@grafana/ui';

import { RuleFormValues, KVObject } from '../types';
import { findDuplicateKeyIndexes } from '../validation';
import { LabelsEditorModal } from './LabelsEditorModal';
import { RuleEditorSection } from './RuleEditorSection';

/**
 * The first complaint about a label key, if the form has one. The modal refuses to save a repeated
 * key, so normally there is nothing to report here -- this is the backstop for a bad set of labels
 * that got into the form some other way. Without it the save would just quietly do nothing,
 * because this step has no input of its own to hang the message on.
 */
function firstLabelKeyError(errors: FieldErrors<RuleFormValues>) {
  const rows = errors.labels;
  if (!Array.isArray(rows)) {
    return undefined;
  }
  return rows.find((row) => row?.key?.message)?.key?.message;
}

/** Every key used by more than one row, listed once each. */
function repeatedKeys(labels: KVObject[]) {
  const keys = findDuplicateKeyIndexes(labels).map((index) => labels[index].key.trim());
  return Array.from(new Set(keys));
}

export const LabelsField = () => {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<RuleFormValues>();
  const labels = watch('labels');
  const [showModal, setShowModal] = useState(false);

  // The chips below are built from a record, so a key used twice shows up as one chip. That leaves
  // nothing on this step for a message to point at, so the message names the keys instead.
  const keyError = firstLabelKeyError(errors);
  const duplicateKeys = keyError ? repeatedKeys(labels) : [];
  const labelsError =
    duplicateKeys.length > 0
      ? t('alerting.labels-field.duplicate-keys', 'Duplicate label keys: {{keys}}', {
          keys: duplicateKeys.join(', '),
        })
      : keyError;

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
        <Field invalid={!!labelsError} error={labelsError} noMargin>
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
          </Stack>
        </Field>
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
