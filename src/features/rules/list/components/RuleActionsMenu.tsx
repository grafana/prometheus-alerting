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
  buttonSize = 'md',
  fill,
}: Props) {
  // Use Cloud Rule Identifier (cri) if we have a ruler rule, otherwise Prometheus Rule Identifier (pri)
  const identifier = rule ? fromRulerRuleAndGroup(rule, groupIdentifier) : fromRuleAndGroup(promRule, groupIdentifier);

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

  const menuItems = (
    <>
      {/* Only show duplicate if we have a ruler rule */}
      {rulerApiEnabled && rule && (
        <Menu.Item label={t('alerting.rule-actions.duplicate', 'Duplicate')} icon="copy" onClick={handleDuplicate} />
      )}
      <Menu.Item label={t('alerting.rule-actions.copy-link', 'Copy link')} icon="share-alt" onClick={handleCopyLink} />
      {/* Only show delete if we have a ruler rule */}
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
