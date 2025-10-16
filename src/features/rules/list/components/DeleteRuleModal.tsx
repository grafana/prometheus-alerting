import React, { useState } from 'react';

import { AppEvents } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { getAppEvents } from '@grafana/runtime';
import { Button, Modal } from '@grafana/ui';

import { useDeleteRuleGroupMutation } from '../../../../api/prometheus.endpoints';
import { DataSourceRuleIdentifier } from '../../../../utils/rule-id';

interface DeleteRuleModalProps {
  identifier: DataSourceRuleIdentifier;
  onClose: () => void;
}

export function DeleteRuleModal({ identifier, onClose }: DeleteRuleModalProps) {
  const [deleteRuleGroup, { isLoading }] = useDeleteRuleGroupMutation();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      await deleteRuleGroup({
        dataSourceUid: identifier.uid,
        namespace: identifier.namespace,
        groupName: identifier.groupName,
      }).unwrap();

      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertSuccess.name,
        payload: [t('alerting.delete-rule.success', 'Rule deleted successfully')],
      });

      onClose();
    } catch (err) {
      console.error('Failed to delete rule:', err);
      setError(err instanceof Error ? err.message : t('alerting.delete-rule.unknown-error', 'Unknown error'));
    }
  };

  return (
    <Modal
      isOpen={true}
      title={t('alerting.delete-rule.title', 'Delete rule')}
      onDismiss={onClose}
      onClickBackdrop={onClose}
    >
      <div>
        <p>
          <Trans
            i18nKey="alerting.delete-rule.message"
            values={{
              ruleName: identifier.ruleName,
              groupName: identifier.groupName,
              namespace: identifier.namespace,
            }}
          >
            Are you sure you want to delete rule <strong>{'{{ ruleName }}'}</strong> from group{' '}
            <strong>{'{{ groupName }}'}</strong> in namespace <strong>{'{{ namespace }}'}</strong>?
          </Trans>
        </p>
        <p>
          <Trans i18nKey="alerting.delete-rule.warning">This action cannot be undone.</Trans>
        </p>
        {error && (
          <div style={{ marginTop: '16px', padding: '8px', backgroundColor: '#f44336', color: 'white' }}>
            <Trans i18nKey="alerting.delete-rule.error" values={{ error }}>
              Error: {'{{ error }}'}
            </Trans>
          </div>
        )}
      </div>
      <Modal.ButtonRow>
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          <Trans i18nKey="alerting.delete-rule.cancel">Cancel</Trans>
        </Button>
        <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
          {isLoading ? (
            <Trans i18nKey="alerting.delete-rule.deleting">Deleting...</Trans>
          ) : (
            <Trans i18nKey="alerting.delete-rule.delete">Delete</Trans>
          )}
        </Button>
      </Modal.ButtonRow>
    </Modal>
  );
}

export function useDeleteRuleModal() {
  const [identifier, setIdentifier] = useState<DataSourceRuleIdentifier | null>(null);

  const showModal = (id: DataSourceRuleIdentifier) => {
    setIdentifier(id);
  };

  const hideModal = () => {
    setIdentifier(null);
  };

  const modal = identifier ? <DeleteRuleModal identifier={identifier} onClose={hideModal} /> : null;

  return [modal, showModal, hideModal] as const;
}
