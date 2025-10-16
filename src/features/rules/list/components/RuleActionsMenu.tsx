import React, { ComponentProps } from 'react';

import { t } from '@grafana/i18n';
import { Button, Dropdown, Menu } from '@grafana/ui';

import { PromRuleDTO } from '@grafana/external-rules/vanilla';

import { DataSourceRuleGroupIdentifier } from '../../../../types/rules';
import { copyToClipboard } from '../../../../utils/clipboard';
import {
  DataSourceRuleIdentifier,
  fromRuleAndGroup,
  fromRulerRuleAndGroup,
  RulerRuleDTO,
} from '../../../../utils/rule-id';
import { rules as rulesNav } from '../../../../utils/navigation';

import MoreButton from './MoreButton';

interface Props {
  rule: PromRuleDTO;
  groupIdentifier: DataSourceRuleGroupIdentifier;
  rulerApiEnabled: boolean;
  onDelete: (identifier: DataSourceRuleIdentifier) => void;
  onDuplicate: (identifier: DataSourceRuleIdentifier) => void;
  buttonSize?: ComponentProps<typeof Button>['size'];
  fill?: ComponentProps<typeof Button>['fill'];
}

export function RuleActionsMenu({
  rule,
  groupIdentifier,
  rulerApiEnabled,
  onDelete,
  onDuplicate,
  buttonSize = 'md',
  fill = 'text',
}: Props) {
  // Use Cloud Rule Identifier (cri) if Ruler API is enabled, otherwise Prometheus Rule Identifier (pri)
  const identifier = rulerApiEnabled
    ? fromRulerRuleAndGroup(rule as unknown as RulerRuleDTO, groupIdentifier)
    : fromRuleAndGroup(rule, groupIdentifier);

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
      {rulerApiEnabled && (
        <Menu.Item label={t('alerting.rule-actions.duplicate', 'Duplicate')} icon="copy" onClick={handleDuplicate} />
      )}
      <Menu.Item label={t('alerting.rule-actions.copy-link', 'Copy link')} icon="share-alt" onClick={handleCopyLink} />
      {rulerApiEnabled && (
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
