import { useEffect, useState } from 'react';

import { DataSourceInstanceSettings } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';

import { useLazyDiscoverFeaturesQuery } from '../../../../api/rules/featureDiscovery.endpoints';
import { isSupportedExternalRulesSourceType } from '../datasourceValidation';

/**
 * Hook to get all data sources that support the Ruler API
 * This filters data sources to only show those where rules can be created/edited
 */
export function useRulesSourcesWithRuler(): {
  rulesSourcesWithRuler: DataSourceInstanceSettings[];
  isLoading: boolean;
} {
  const [rulesSourcesWithRuler, setRulesSourcesWithRuler] = useState<DataSourceInstanceSettings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [discoverFeatures] = useLazyDiscoverFeaturesQuery();

  useEffect(() => {
    const loadDataSources = async () => {
      setIsLoading(true);

      // Get all Prometheus-compatible data sources
      const allDataSources = getDataSourceSrv().getList();
      const rulesSources = allDataSources.filter((ds) => isSupportedExternalRulesSourceType(ds.type));

      // Check each data source for Ruler API support
      const sourcesWithRuler: DataSourceInstanceSettings[] = [];

      await Promise.all(
        rulesSources.map(async (ds) => {
          try {
            const { data: dsFeatures } = await discoverFeatures({ uid: ds.uid }, true);
            if (dsFeatures?.rulerApiEnabled) {
              sourcesWithRuler.push(ds);
            }
          } catch (error) {
            // Silently skip data sources that fail feature discovery
            console.warn(`Failed to discover features for data source ${ds.name}:`, error);
          }
        })
      );

      setRulesSourcesWithRuler(sourcesWithRuler);
      setIsLoading(false);
    };

    loadDataSources();
  }, [discoverFeatures]);

  return { rulesSourcesWithRuler, isLoading };
}
