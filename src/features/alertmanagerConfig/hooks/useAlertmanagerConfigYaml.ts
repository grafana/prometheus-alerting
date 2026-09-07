import { useCallback } from 'react';

import { readAlertmanagerConfigYaml, writeAlertmanagerConfigYaml } from '@grafana/external-alertmanager/mimir';

import { mimirAlertmanagerApi } from '../../../api/alertmanager/mimir.endpoints';
import { assertAlertmanagerConfigMutationAllowed } from '../../../access-control/assertMutationAllowed';
import { useAlertmanager } from '../../../hooks/useAlertmanager';
import { useAlertmanagerConfigMutationAbility } from '../../../hooks/useAlertmanagerConfigMutationAbility';

const { getUserConfigurationDocument, updateUserConfigurationDocument } = mimirAlertmanagerApi.endpoints;

/**
 * Reads the Alertmanager configuration Mimir has stored, as YAML, without parsing it.
 *
 * Reading the raw document rather than re-serialising the parsed one is what makes the editor
 * trustworthy: people see their own comments, key order and quoting, and a configuration our zod
 * schemas would reject can still be opened and repaired.
 */
export function useAlertmanagerConfigYaml() {
  const { uid: dataSourceUID } = useAlertmanager();

  const { data, isLoading, error, refetch } = getUserConfigurationDocument.useQuery({ dataSourceUID });

  return {
    configuration: data === undefined ? undefined : readAlertmanagerConfigYaml(data),
    isLoading,
    error,
    refetch,
  };
}

/** Replaces the stored Alertmanager configuration with the given YAML. */
export function useUpdateAlertmanagerConfigYaml() {
  const { uid: dataSourceUID } = useAlertmanager();
  const mutationAbility = useAlertmanagerConfigMutationAbility();

  const [fetchDocument] = getUserConfigurationDocument.useLazyQuery();
  const [postDocument, { isLoading }] = updateUserConfigurationDocument.useMutation();

  const updateConfiguration = useCallback(
    async (alertmanagerConfig: string) => {
      assertAlertmanagerConfigMutationAllowed(mutationAbility);

      // Fetch the document again rather than reusing the copy the editor was seeded with, so a
      // template file somebody else added in the meantime is not thrown away by this save.
      const currentDocument = await fetchDocument({ dataSourceUID }, false).unwrap();
      const document = writeAlertmanagerConfigYaml(currentDocument, alertmanagerConfig);

      return postDocument({ dataSourceUID, document }).unwrap();
    },
    [dataSourceUID, fetchDocument, mutationAbility, postDocument]
  );

  return { updateConfiguration, isUpdating: isLoading };
}
