import { useCallback } from 'react';

import { DataSourceRuleIdentifier } from '@grafana/external-rules/identifiers';

import { rules as rulesNav, silences as silencesNav } from '../../../../utils/navigation';
import { useDeleteRuleModal } from '../components/DeleteRuleModal';

/**
 * Hook that provides common rule action handlers.
 * This centralizes the logic for duplicate, silence, and delete actions
 * to avoid duplication across components.
 */
export function useRuleActions() {
  const [deleteModal, showDeleteModal] = useDeleteRuleModal();

  const handleDuplicate = useCallback((identifier: DataSourceRuleIdentifier) => {
    const cloneUrl = rulesNav.clonePageLink(identifier);
    window.location.href = cloneUrl;
  }, []);

  const handleSilence = useCallback((_identifier: DataSourceRuleIdentifier, ruleName: string) => {
    const silenceUrl = silencesNav.createForRuleLink(ruleName);
    window.location.href = silenceUrl;
  }, []);

  return {
    handleDuplicate,
    handleSilence,
    handleDelete: showDeleteModal,
    deleteModal,
  };
}
