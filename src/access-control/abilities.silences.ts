import { Ability, AlertingPermission, makeAbility } from './abilities';

export enum SilenceAction {
  ViewSilences = 'view-silences',
  MutateSilences = 'mutate-silences',
}

export type SilenceAbilities = Record<SilenceAction, Ability>;

/**
 * Maps Grafana instance permissions to silence-page abilities.
 *
 * Silences are served by the Alertmanager v2 runtime API, which both the vanilla and Mimir
 * implementations expose, so — unlike the configuration-backed resources — there is no datasource
 * capability to check here.
 */
export function getSilencesAbilities(): SilenceAbilities {
  const viewSilences = makeAbility({
    permission: AlertingPermission.InstancesRead,
    supported: true,
  });
  const mutateSilences = makeAbility({
    permission: AlertingPermission.InstancesWrite,
    supported: true,
  });

  return {
    [SilenceAction.ViewSilences]: viewSilences,
    [SilenceAction.MutateSilences]: mutateSilences,
  };
}
