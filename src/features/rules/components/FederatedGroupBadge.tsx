import React from 'react';

import { t } from '@grafana/i18n';
import { Badge } from '@grafana/ui';

interface FederatedGroupBadgeProps {
  /** The tenants named in the group's `source_tenants`, listed in the tooltip when there are any. */
  sourceTenants: string[];
}

/**
 * Marks a group whose rules read data from other tenants.
 *
 * These groups can't be edited here, and a missing Edit button on its own just looks like
 * something went wrong, so say what is going on.
 */
export function FederatedGroupBadge({ sourceTenants }: FederatedGroupBadgeProps) {
  const tooltip = sourceTenants.length
    ? t(
        'alerting.federated-group-badge.tooltip-tenants',
        'This group reads data from {{tenants}}. Edit it through the Ruler API.',
        { tenants: sourceTenants.join(', ') }
      )
    : t(
        'alerting.federated-group-badge.tooltip',
        'This group reads data from other tenants. Edit it through the Ruler API.'
      );

  return (
    <Badge
      color="blue"
      icon="layer-group"
      text={t('alerting.federated-group-badge.text', 'Federated')}
      tooltip={tooltip}
    />
  );
}
