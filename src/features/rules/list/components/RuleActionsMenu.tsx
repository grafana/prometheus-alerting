import React, { ComponentProps } from 'react';

import { t } from '@grafana/i18n';
import { Button, Dropdown, Menu } from '@grafana/ui';

import { PromRuleDTO, RulerRuleDTO } from '@grafana/external-rules/vanilla';
import { DataSourceRuleIdentifier } from '@grafana/external-rules/identifiers';

import { DataSourceRuleGroupIdentifier } from '../../../../types/rules';
import { copyToClipboard } from '../../../../utils/clipboard';
import { fromRuleAndGroup, fromRulerRuleAndGroup } from '../../../../utils/rule-id';
import { rules as rulesNav } from '../../../../utils/navigation';

import MoreButton from './MoreButton';

interface Props {
  rule?: RulerRuleDTO; // The editable rule from Ruler API (undefined if Ruler API not supported)
  promRule: PromRuleDTO; // The read-only rule from Prometheus API
  groupIdentifier: DataSourceRuleGroupIdentifier;
  rulerApiEnabled: boolean;
  onDelete: (identifier: DataSourceRuleIdentifier) => void;
  onDuplicate: (identifier: DataSourceRuleIdentifier) => void;
  onSilence?: (identifier: DataSourceRuleIdentifier, ruleName: string) => void;
  buttonSize?: ComponentProps<typeof Button>['size'];
  fill?: ComponentProps<typeof Button>['fill'];
}

export function RuleActionsMenu({
  rule,
  promRule,
  groupIdentifier,
  rulerApiEnabled,
  onDelete,
  onDuplicate,
  onSilence,
  buttonSize = 'md',
  fill,
}: Props) {
  // Use Cloud Rule Identifier (cri) if we have a ruler rule, otherwise Prometheus Rule Identifier (pri)
  const identifier = rule ? fromRulerRuleAndGroup(rule, groupIdentifier) : fromRuleAndGroup(promRule, groupIdentifier);

  // Check if this is an alerting rule (not recording rule) - silence only applies to alerting rules
  const isAlertingRule = promRule.type === 'alerting';

  const handleCopyLink = () => {
    const shareUrl = rulesNav.shareLink(identifier);
    copyToClipboard(shareUrl);
  };

  const handleDuplicate = () => {
    onDuplicate(identifier);
  };

  const handleDelete = () => {
    onDelete(identifier);
  };

  const handleSilence = () => {
    if (onSilence) {
      onSilence(identifier, promRule.name);
    }
  };

  const menuItems = (
    <>
      {/* Silence notifications - only for alerting rules */}
      {isAlertingRule && (
        <Menu.Item
          label={t('alerting.rule-actions.silence', 'Silence notifications')}
          icon="bell-slash"
          onClick={handleSilence}
          disabled={!onSilence}
        />
      )}
      {/* Duplicate - only with Ruler API */}
      {rulerApiEnabled && rule && (
        <Menu.Item label={t('alerting.rule-actions.duplicate', 'Duplicate')} icon="copy" onClick={handleDuplicate} />
      )}
      <Menu.Divider />
      <Menu.Item label={t('alerting.rule-actions.copy-link', 'Copy link')} icon="share-alt" onClick={handleCopyLink} />
      {/* Export - placeholder for future implementation */}
      <Menu.Item
        label={t('alerting.rule-actions.export', 'Export')}
        icon="download-alt"
        disabled
        onClick={() => {
          // TODO: Implement export functionality
        }}
      />
      {/* Delete - only with Ruler API */}
      {rulerApiEnabled && rule && (
        <>
          <Menu.Divider />
          <Menu.Item
            label={t('alerting.rule-actions.delete', 'Delete')}
            icon="trash-alt"
            destructive
            onClick={handleDelete}
          />
        </>
      )}
    </>
  );

  return (
    <Dropdown overlay={<Menu>{menuItems}</Menu>} placement="bottom-end">
      <MoreButton size={buttonSize} fill={fill} />
    </Dropdown>
  );
}
