import { useCallback, useState } from 'react';

import { DataSourceRuleIdentifier } from '@grafana/external-rules/identifiers';
import type { RulerRuleDTO } from '@grafana/external-rules/vanilla';

import { rules as rulesNav, silences as silencesNav } from '../../../../utils/navigation';
import { useDeleteRuleModal } from '../components/DeleteRuleModal';

/**
 * Hook that provides common rule action handlers.
 * This centralizes the logic for duplicate, silence, delete, and export actions
 * to avoid duplication across components.
 */
export function useRuleActions() {
  const [deleteModal, showDeleteModal] = useDeleteRuleModal();
  const [exportingRule, setExportingRule] = useState<RulerRuleDTO | null>(null);

  const handleDuplicate = useCallback((identifier: DataSourceRuleIdentifier) => {
    const cloneUrl = rulesNav.clonePageLink(identifier);
    window.location.href = cloneUrl;
  }, []);

  const handleSilence = useCallback((_identifier: DataSourceRuleIdentifier, ruleName: string) => {
    const silenceUrl = silencesNav.createForRuleLink(ruleName);
    window.location.href = silenceUrl;
  }, []);

  const handleExport = useCallback((rule: RulerRuleDTO) => {
    setExportingRule(rule);
  }, []);

  const closeExportDrawer = useCallback(() => {
    setExportingRule(null);
  }, []);

  return {
    handleDuplicate,
    handleSilence,
    handleDelete: showDeleteModal,
    handleExport,
    deleteModal,
    exportingRule,
    closeExportDrawer,
  };
}
