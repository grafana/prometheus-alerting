import React from 'react';

import { t } from '@grafana/i18n';

import type { RulerRuleDTO } from '@grafana/external-rules/vanilla';
import { getRuleName } from '@grafana/external-rules/utils';

import { ExportDrawer } from './ExportDrawer';
import { RuleExportPreview } from './RuleExportPreview';

interface RuleExporterProps {
  rule: RulerRuleDTO;
  onClose: () => void;
}

/**
 * Main component for exporting a rule.
 * Opens a drawer with format tabs and a preview of the exported rule.
 */
export function RuleExporter({ rule, onClose }: RuleExporterProps) {
  const ruleName = getRuleName(rule);
  const title = t('alerting.export.rule-title', 'Export rule');

  return (
    <ExportDrawer title={title} onClose={onClose}>
      {(activeFormat) => <RuleExportPreview rule={rule} ruleName={ruleName} format={activeFormat} onClose={onClose} />}
    </ExportDrawer>
  );
}
