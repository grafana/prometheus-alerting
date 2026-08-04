import React, { useState } from 'react';

import { AppEvents } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { getAppEvents } from '@grafana/runtime';
import { Alert, Button, Modal } from '@grafana/ui';

import { CloudRuleIdentifier } from '@grafana/external-rules/identifiers';
import { useInvalidatePromRules } from '../../hooks/useInvalidatePromRules';
import { useRuleConsistencyCheck } from '../../hooks/useRuleConsistencyCheck';
import { useDeleteRuleFromGroup } from '../../rule-editor/hooks/useDeleteRuleFromGroup';
import { AlertingAction, isAbilityAllowed, useScopedAbilities } from '../../../../access-control/abilities';

interface DeleteRuleModalProps {
  identifier: CloudRuleIdentifier;
  onClose: () => void;
  /** Called after the rule has been deleted successfully, before the modal closes */
  onDeleted?: (identifier: CloudRuleIdentifier) => void;
}

export function DeleteRuleModal({ identifier, onClose, onDeleted }: DeleteRuleModalProps) {
  const deleteAbility = useScopedAbilities(identifier.uid)[AlertingAction.DeleteRule];
  const canDeleteRules = isAbilityAllowed(deleteAbility);
  const invalidatePromRules = useInvalidatePromRules();
  const [deleteRuleFromGroup, { isLoading: isDeleting }] = useDeleteRuleFromGroup();
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
      // Step 1: Remove the rule from its group.
      // The Ruler API cannot delete a single rule, so this rewrites the group without
      // that rule – or deletes the group when it was the only rule left.
      await deleteRuleFromGroup(identifier);

      // Step 2: Wait for Prometheus API to reflect the deletion
      // This prevents the list from showing stale data
      setIsWaitingForConsistency(true);
      await waitForRemoval(identifier);
      setIsWaitingForConsistency(false);

      // Step 3: Evict the cached Prometheus rules, or the list keeps showing the deleted rule
      invalidatePromRules(identifier.uid);

      // Step 4: Show success and close
      const appEvents = getAppEvents();
      appEvents.publish({
        type: AppEvents.alertSuccess.name,
        payload: [t('alerting.delete-rule.success', 'Rule deleted successfully')],
      });

      onDeleted?.(identifier);
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

export function useDeleteRuleModal(onDeleted?: (identifier: CloudRuleIdentifier) => void) {
  const [identifier, setIdentifier] = useState<CloudRuleIdentifier | null>(null);

  const showModal = (id: CloudRuleIdentifier) => {
    setIdentifier(id);
  };

  const hideModal = () => {
    setIdentifier(null);
  };

  const modal = identifier ? (
    <DeleteRuleModal identifier={identifier} onClose={hideModal} onDeleted={onDeleted} />
  ) : null;

  return [modal, showModal, hideModal] as const;
}
