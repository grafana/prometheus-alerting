import React from 'react';

import { Icon } from '@grafana/ui';

import { RulesSourceApplication } from '../../../../api/rules/featureDiscovery.types';

interface DataSourceIconProps {
  application?: RulesSourceApplication;
  size?: number;
}

export const DataSourceIcon = ({ application }: DataSourceIconProps) => {
  // For now, just use a simple icon
  // TODO: Add actual logos for Prometheus, Mimir, etc. when available
  switch (application) {
    case 'prometheus':
    case 'mimir':
    case 'cortex':
    case 'loki':
    default:
      return <Icon name="gf-prometheus" />;
  }
};
