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

const granted = { granted: true } satisfies Ability;
const notSupported = { granted: false, cause: 'NOT_SUPPORTED' } satisfies Ability;
const loading = { granted: false, cause: 'LOADING' } satisfies AsyncAbility;

function insufficientPermissions(permission: AlertingPermission): Ability {
  return {
    granted: false,
    cause: 'INSUFFICIENT_PERMISSIONS',
    anyOfPermissions: [permission],
  };
}

function makePermissionAbility(permission: AlertingPermission): Ability {
  return hasPermission(permission) ? granted : insufficientPermissions(permission);
}

function makeDataSourceAbility({
  dataSourceUid,
  rulerApiEnabled,
  isLoading,
  error,
  unscopedAbility,
}: {
  dataSourceUid?: string;
  rulerApiEnabled: boolean;
  isLoading: boolean;
  error?: unknown;
  unscopedAbility: Ability;
}): AsyncAbility {
  if (!unscopedAbility.granted) {
    return unscopedAbility;
  }

  if (!dataSourceUid) {
    return notSupported;
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

  return unscopedAbility;
}

/** Returns abilities that only depend on Grafana RBAC permissions. */
export function useUnscopedAbilities(): UnscopedAbilities {
  const rulesRead = makePermissionAbility(AlertingPermission.RulesRead);
  const rulesWrite = makePermissionAbility(AlertingPermission.RulesWrite);
  const instancesRead = makePermissionAbility(AlertingPermission.InstancesRead);
  const instancesWrite = makePermissionAbility(AlertingPermission.InstancesWrite);
  const notificationsRead = makePermissionAbility(AlertingPermission.NotificationsRead);
  const notificationsWrite = makePermissionAbility(AlertingPermission.NotificationsWrite);

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
export function useScopedAbilities(dataSourceUid: string | undefined): ScopedAbilities {
  const rulesWriteAbility = makePermissionAbility(AlertingPermission.RulesWrite);
  const {
    data: features,
    isLoading,
    error,
  } = useDiscoverFeaturesQuery(dataSourceUid && rulesWriteAbility.granted ? { uid: dataSourceUid } : skipToken);
  const rulerConfigApiAvailable = features?.rulerApiEnabled ?? false;
  const scopedRulesWriteAbility = makeDataSourceAbility({
    dataSourceUid,
    rulerApiEnabled: rulerConfigApiAvailable,
    isLoading,
    error,
    unscopedAbility: rulesWriteAbility,
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
