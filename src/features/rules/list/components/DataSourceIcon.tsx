import React from 'react';

import { getDataSourceSrv } from '@grafana/runtime';
import { Icon } from '@grafana/ui';
import lokiIconSvg from '../../../../img/loki_icon.svg';
import mimirLogoSvg from '../../../../img/mimir_logo.svg';
import prometheusLogoSvg from '../../../../img/prometheus_logo.svg';

import { RulesSourceApplication } from '../../../../types/rules';

interface DataSourceIconProps {
  application?: RulesSourceApplication;
  /**
   * Used to fall back to the data source's own plugin logo when the application is unknown.
   *
   * Worth passing wherever the application may be missing -- most importantly when feature
   * discovery failed, since that is what normally determines it. Prometheus, Mimir, and Cortex all
   * register as plugin type `prometheus`, so a failed discovery leaves us unable to say which of
   * the three this is; the plugin logo is the most specific thing still available.
   */
  dataSourceUid?: string;
  size?: number;
}

export const DataSourceIcon = ({ application, dataSourceUid, size = 16 }: DataSourceIconProps) => {
  switch (application) {
    case 'prometheus':
      return <img width={size} height={size} src={prometheusLogoSvg} alt="Prometheus" />;
    case 'mimir':
      return <img width={size} height={size} src={mimirLogoSvg} alt="Mimir" />;
    case 'loki':
      return <img width={size} height={size} src={lokiIconSvg} alt="Loki" />;
  }

  // Application-keyed logos above are more specific than the plugin's own -- a Mimir data source
  // registers as `prometheus` and would otherwise show the Prometheus logo. Only fall back once
  // those are exhausted.
  const settings = dataSourceUid ? getDataSourceSrv().getInstanceSettings(dataSourceUid) : undefined;
  const pluginLogo = settings?.meta.info.logos.small;

  if (pluginLogo) {
    return <img width={size} height={size} src={pluginLogo} alt={settings.meta.name} />;
  }

  return <Icon name="grafana" />;
};
