import { hasPermission } from '@grafana/runtime';
import { skipToken } from '@reduxjs/toolkit/query';

import { useDiscoverFeaturesQuery } from '../api/rules/featureDiscovery.endpoints';

/** User actions, RBAC permissions, and datasource capability checks for alerting. */

export enum AlertingAction {
  ViewRules = 'view-rules',
  CreateRule = 'create-rule',
  UpdateRule = 'update-rule',
  DeleteRule = 'delete-rule',
  SilenceRule = 'silence-rule',
  ViewInstances = 'view-instances',
  UpdateInstances = 'update-instances',
  ViewNotifications = 'view-notifications',
  UpdateNotifications = 'update-notifications',
}

export enum AlertingPermission {
  RulesRead = 'alert.rules.external:read',
  RulesWrite = 'alert.rules.external:write',
  InstancesRead = 'alert.instances.external:read',
  InstancesWrite = 'alert.instances.external:write',
  NotificationsRead = 'alert.notifications.external:read',
  NotificationsWrite = 'alert.notifications.external:write',
}

export type ScopedAction = AlertingAction.CreateRule | AlertingAction.UpdateRule | AlertingAction.DeleteRule;
export type UnscopedAction =
  | AlertingAction.ViewRules
  | AlertingAction.CreateRule
  | AlertingAction.SilenceRule
  | AlertingAction.ViewInstances
  | AlertingAction.UpdateInstances
  | AlertingAction.ViewNotifications
  | AlertingAction.UpdateNotifications;

export type Ability =
  | { granted: true }
  | { granted: false; cause: 'NOT_SUPPORTED' }
  | { granted: false; cause: 'INSUFFICIENT_PERMISSIONS'; anyOfPermissions: AlertingPermission[] };

export type AsyncAbility =
  | Ability
  | { granted: false; cause: 'LOADING' }
  | { granted: false; cause: 'ERROR'; error: unknown };

export type UnscopedAbilities = Record<UnscopedAction, Ability>;
export type ScopedAbilities = Record<ScopedAction, AsyncAbility>;

/** Returns abilities that only depend on Grafana RBAC permissions. */
export function useUnscopedAbilities(): UnscopedAbilities {
  const rulesRead = permissionToAbility(AlertingPermission.RulesRead);
  const rulesWrite = permissionToAbility(AlertingPermission.RulesWrite);
  const instancesRead = permissionToAbility(AlertingPermission.InstancesRead);
  const instancesWrite = permissionToAbility(AlertingPermission.InstancesWrite);
  const notificationsRead = permissionToAbility(AlertingPermission.NotificationsRead);
  const notificationsWrite = permissionToAbility(AlertingPermission.NotificationsWrite);

  return {
    [AlertingAction.ViewRules]: rulesRead,
    [AlertingAction.CreateRule]: rulesWrite,
    [AlertingAction.SilenceRule]: instancesWrite,
    [AlertingAction.ViewInstances]: instancesRead,
    [AlertingAction.UpdateInstances]: instancesWrite,
    [AlertingAction.ViewNotifications]: notificationsRead,
    [AlertingAction.UpdateNotifications]: notificationsWrite,
  };
}

/**
 * Returns the actions available for a data source. Actions that change rules
 * additionally require the data source's Ruler configuration API.
 */
export function useScopedAbilities(dataSourceUid: string): ScopedAbilities {
  const hasRulesWritePermission = hasPermission(AlertingPermission.RulesWrite);

  const featureDiscoveryOptions = hasRulesWritePermission ? { uid: dataSourceUid } : skipToken;
  const { data: features, isLoading, error } = useDiscoverFeaturesQuery(featureDiscoveryOptions);

  const rulerConfigApiAvailable = features?.rulerApiEnabled ?? false;

  const scopedRulesWriteAbility = makeRuleMutationAbility({
    hasRulesWritePermission,
    rulerApiEnabled: rulerConfigApiAvailable,
    isLoading,
    error,
  });

  return {
    [AlertingAction.CreateRule]: scopedRulesWriteAbility,
    [AlertingAction.UpdateRule]: scopedRulesWriteAbility,
    [AlertingAction.DeleteRule]: scopedRulesWriteAbility,
  };
}

export function isAbilityAllowed(ability: AsyncAbility): boolean {
  return ability.granted;
}

const granted = { granted: true } satisfies Ability;
const notSupported = { granted: false, cause: 'NOT_SUPPORTED' } satisfies Ability;
const loading = { granted: false, cause: 'LOADING' } satisfies AsyncAbility;

function permissionToAbility(permission: AlertingPermission): Ability {
  return hasPermission(permission) ? granted : insufficientPermissions(permission);
}

function makeRuleMutationAbility({
  hasRulesWritePermission,
  rulerApiEnabled,
  isLoading,
  error,
}: {
  hasRulesWritePermission: boolean;
  rulerApiEnabled: boolean;
  isLoading: boolean;
  error?: unknown;
}): AsyncAbility {
  if (!hasRulesWritePermission) {
    return insufficientPermissions(AlertingPermission.RulesWrite);
  }

  if (isLoading) {
    return loading;
  }

  if (error) {
    return { granted: false, cause: 'ERROR', error };
  }

  if (!rulerApiEnabled) {
    return notSupported;
  }

  return granted;
}

function insufficientPermissions(permission: AlertingPermission): Ability {
  return {
    granted: false,
    cause: 'INSUFFICIENT_PERMISSIONS',
    anyOfPermissions: [permission],
  };
}
