import React from 'react';

import { Icon, Stack, TextLink, Tooltip } from '@grafana/ui';

import { RulesSourceApplication } from '../../../../api/rules/featureDiscovery.types';

import { DataSourceIcon } from './DataSourceIcon';

interface RuleLocationProps {
  namespace: string;
  group: string;
  groupUrl?: string;
  rulesSource?: { uid: string; name: string };
  application?: RulesSourceApplication;
}

export function RuleLocation({ namespace, group, groupUrl, rulesSource, application }: RuleLocationProps) {
  return (
    <Stack direction="row" alignItems="center" gap={0.5}>
      {/* Only show data source icon for DMA rules */}
      {rulesSource && application && (
        <Tooltip content={rulesSource.name}>
          <span>
            <DataSourceIcon application={application} size={14} />
          </span>
        </Tooltip>
      )}

      <Stack direction="row" alignItems="center" gap={0}>
        {namespace}
        <Icon size="sm" name="angle-right" />
        {groupUrl ? (
          <TextLink href={groupUrl} color="secondary" variant="bodySmall" inline={false}>
            {group}
          </TextLink>
        ) : (
          group
        )}
      </Stack>
    </Stack>
  );
}
