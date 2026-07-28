import React, { useState } from 'react';

import { AppEvents } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { getAppEvents } from '@grafana/runtime';
import { Alert, Button, Modal } from '@grafana/ui';

import { rulerApi } from '../../../../api/rules/mimir.endpoints';
import { DataSourceRuleIdentifier } from '@grafana/external-rules/identifiers';
import { useRuleConsistencyCheck } from '../../hooks/useRuleConsistencyCheck';
import { AlertingAction, isAbilityAllowed, useScopedAbilities } from '../../../../access-control/abilities';

const { useDeleteRuleGroupMutation } = rulerApi;

interface DeleteRuleModalProps {
  identifier: DataSourceRuleIdentifier;
  onClose: () => void;
}

export function DeleteRuleModal({ identifier, onClose }: DeleteRuleModalProps) {
  const deleteAbility = useScopedAbilities(identifier.uid)[AlertingAction.DeleteRule];
  const canDeleteRules = isAbilityAllowed(deleteAbility);
  const [deleteRuleGroup, { isLoading: isDeleting }] = useDeleteRuleGroupMutation();
  const { waitForRemoval } = useRuleConsistencyCheck();
  const [error, setError] = useState<string | null>(null);
  const [isWaitingForConsistency, setIsWaitingForConsistency] = useState(false);

  const isLoading = isDeleting || isWaitingForConsistency;

  const handleDelete = async () => {
    if (!canDeleteRules) {
      setError(t('alerting.delete-rule.permission-denied', 'You do not have permission to delete rules.'));
      return;
    }

    try {
      // Step 1: Delete the rule from the Ruler API
      await deleteRuleGroup({
        dataSourceUid: identifier.uid,
        namespace: identifier.namespace,
        groupName: identifier.groupName,
      }).unwrap();

      // Step 2: Wait for Prometheus API to reflect the deletion
      // This prevents the list from showing stale data
      setIsWaitingForConsistency(true);
      await waitForRemoval(identifier);
      setIsWaitingForConsistency(false);

      // Step 3: Show success and close
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertSuccess.name,
        payload: [t('alerting.delete-rule.success', 'Rule deleted successfully')],
      });

      onClose();
    } catch (err) {
      setIsWaitingForConsistency(false);
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
          <Alert severity="error" title={t('alerting.delete-rule.error-title', 'Delete failed')}>
            {error}
          </Alert>
        )}
        {isWaitingForConsistency && (
          <Alert severity="info" title={t('alerting.delete-rule.consistency-title', 'Confirming deletion')}>
            <Trans i18nKey="alerting.delete-rule.consistency-message">
              Waiting for the deletion to propagate. This ensures the rule list shows accurate data.
            </Trans>
          </Alert>
        )}
      </div>
      <Modal.ButtonRow>
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          <Trans i18nKey="alerting.delete-rule.cancel">Cancel</Trans>
        </Button>
        <Button variant="destructive" onClick={handleDelete} disabled={isLoading || !canDeleteRules}>
          {isDeleting ? (
            <Trans i18nKey="alerting.delete-rule.deleting">Deleting...</Trans>
          ) : isWaitingForConsistency ? (
            <Trans i18nKey="alerting.delete-rule.confirming">Confirming...</Trans>
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
