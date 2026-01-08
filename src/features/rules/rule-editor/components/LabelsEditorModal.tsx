import { css } from '@emotion/css';
import React, { useState } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Button, Field, Input, Modal, Stack, useStyles2 } from '@grafana/ui';

import { KVObject } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (labels: KVObject[]) => void;
  initialLabels: KVObject[];
}

export const LabelsEditorModal = ({ isOpen, onClose, onSave, initialLabels }: Props) => {
  const styles = useStyles2(getStyles);
  const [labels, setLabels] = useState<KVObject[]>(initialLabels.length > 0 ? initialLabels : [{ key: '', value: '' }]);

  const handleAddLabel = () => {
    setLabels([...labels, { key: '', value: '' }]);
  };

  const handleRemoveLabel = (index: number) => {
    const newLabels = labels.filter((_, idx) => idx !== index);
    setLabels(newLabels.length > 0 ? newLabels : [{ key: '', value: '' }]);
  };

  const handleLabelChange = (index: number, field: 'key' | 'value', value: string) => {
    const newLabels = [...labels];
    newLabels[index][field] = value;
    setLabels(newLabels);
  };

  const handleSave = () => {
    onSave(labels);
  };

  return (
    <Modal
      isOpen={isOpen}
      title={t('alerting.labels-editor-modal.title', 'Edit labels')}
      onDismiss={onClose}
      closeOnEscape
    >
      <Stack direction="column" gap={2}>
        {labels.map((label, index) => (
          <Stack key={index} direction="row" gap={1} alignItems="flex-end">
            <Field
              label={index === 0 ? t('alerting.labels-editor-modal.label-key', 'Key') : ''}
              className={styles.fieldKey}
              noMargin
            >
              <Input
                value={label.key}
                onChange={(e) => handleLabelChange(index, 'key', e.currentTarget.value)}
                placeholder={t('alerting.labels-editor-modal.placeholder-key', 'Label key')}
              />
            </Field>
            <Field
              label={index === 0 ? t('alerting.labels-editor-modal.label-value', 'Value') : ''}
              className={styles.fieldValue}
              noMargin
            >
              <Input
                value={label.value}
                onChange={(e) => handleLabelChange(index, 'value', e.currentTarget.value)}
                placeholder={t('alerting.labels-editor-modal.placeholder-value', 'Label value')}
              />
            </Field>
            <Button
              type="button"
              variant="secondary"
              icon="trash-alt"
              onClick={() => handleRemoveLabel(index)}
              tooltip={t('alerting.labels-editor-modal.remove-label', 'Remove label')}
            />
          </Stack>
        ))}
        <Stack direction="row" gap={1}>
          <Button type="button" variant="secondary" icon="plus" onClick={handleAddLabel}>
            {t('alerting.labels-editor-modal.add-label', 'Add label')}
          </Button>
        </Stack>
        <Stack direction="row" gap={1} justifyContent="flex-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('alerting.common.cancel', 'Cancel')}
          </Button>
          <Button type="button" variant="primary" onClick={handleSave}>
            {t('alerting.common.save', 'Save')}
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  fieldKey: css({
    flexGrow: 1,
  }),
  fieldValue: css({
    flexGrow: 1,
  }),
});
