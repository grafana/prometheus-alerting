import React from 'react';

import { Icon } from '@grafana/ui';
import lokiIconSvg from '../../../../img/loki_icon.svg';
import mimirLogoSvg from '../../../../img/mimir_logo.svg';
import prometheusLogoSvg from '../../../../img/prometheus_logo.svg';

import { RulesSourceApplication } from '../../../../types/rules';

interface DataSourceIconProps {
  application?: RulesSourceApplication;
  size?: number;
}

export const DataSourceIcon = ({ application, size = 16 }: DataSourceIconProps) => {
  switch (application) {
    case 'prometheus':
      return <img width={size} height={size} src={prometheusLogoSvg} alt="Prometheus" />;
    case 'mimir':
      return <img width={size} height={size} src={mimirLogoSvg} alt="Mimir" />;
    case 'loki':
      return <img width={size} height={size} src={lokiIconSvg} alt="Loki" />;
    default:
      return <Icon name="grafana" />;
  }
};
