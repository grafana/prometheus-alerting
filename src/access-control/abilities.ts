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

/** An ability that is not available, narrowed so callers can switch on `cause`. */
export type DeniedAbility = Extract<AsyncAbility, { granted: false }>;

export type UnscopedAbilities = Record<UnscopedAction, Ability>;
export type ScopedAbilities = Record<ScopedAction, AsyncAbility>;

/** Returns abilities that only depend on Grafana RBAC permissions. */
export function useUnscopedAbilities(): UnscopedAbilities {
  const rulesRead = makeSupportedAbility(AlertingPermission.RulesRead);
  const rulesWrite = makeSupportedAbility(AlertingPermission.RulesWrite);
  const instancesRead = makeSupportedAbility(AlertingPermission.InstancesRead);
  const instancesWrite = makeSupportedAbility(AlertingPermission.InstancesWrite);
  const notificationsRead = makeSupportedAbility(AlertingPermission.NotificationsRead);
  const notificationsWrite = makeSupportedAbility(AlertingPermission.NotificationsWrite);

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
 *
 * Callers must have a data source to scope to — where there is none (creating a
 * rule from scratch) use {@link useUnscopedAbilities} instead.
 */
export function useScopedAbilities(dataSourceUid: string): ScopedAbilities {
  const hasRulesWritePermission = hasPermission(AlertingPermission.RulesWrite);

  const featureDiscoveryOptions = hasRulesWritePermission ? { uid: dataSourceUid } : skipToken;
  const { data: features, isLoading, error } = useDiscoverFeaturesQuery(featureDiscoveryOptions);

  const rulerConfigApiAvailable = features?.rulerApiEnabled ?? false;

  const scopedRulesWriteAbility = makeAsyncAbility({
    permission: AlertingPermission.RulesWrite,
    supported: rulerConfigApiAvailable,
    isLoading,
    error,
  });

  return {
    [AlertingAction.CreateRule]: scopedRulesWriteAbility,
    [AlertingAction.UpdateRule]: scopedRulesWriteAbility,
    [AlertingAction.DeleteRule]: scopedRulesWriteAbility,
  };
}

export function isAbilityAllowed(ability: AsyncAbility): ability is { granted: true } {
  return ability.granted;
}

const granted = { granted: true } satisfies Ability;
const notSupported = { granted: false, cause: 'NOT_SUPPORTED' } satisfies Ability;
const loading = { granted: false, cause: 'LOADING' } satisfies AsyncAbility;

function makeSupportedAbility(permission: AlertingPermission): Ability {
  return makeAbility({ permission, supported: true });
}

/** Returns a synchronous ability from a Grafana permission and optional capability support. */
export function makeAbility({
  permission,
  supported,
}: {
  permission: AlertingPermission;
  supported: boolean;
}): Ability {
  if (!hasPermission(permission)) {
    return insufficientPermissions(permission);
  }

  return supported ? granted : notSupported;
}

export function makeAsyncAbility({
  permission,
  supported,
  isLoading,
  error,
}: {
  permission: AlertingPermission;
  supported: boolean;
  isLoading: boolean;
  error?: unknown;
}): AsyncAbility {
  if (!hasPermission(permission)) {
    return insufficientPermissions(permission);
  }

  if (isLoading) {
    return loading;
  }

  if (error) {
    return { granted: false, cause: 'ERROR', error };
  }

  if (!supported) {
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
