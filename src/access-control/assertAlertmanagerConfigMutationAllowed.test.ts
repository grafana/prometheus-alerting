import { describe, expect, it } from 'vitest';

import { AlertingPermission } from './abilities';
import { assertAlertmanagerConfigMutationAllowed } from './assertAlertmanagerConfigMutationAllowed';
import { PermissionDeniedError, UnsupportedOperationError } from './errors';

describe('assertAlertmanagerConfigMutationAllowed', () => {
  it('allows a granted ability through', () => {
    expect(() => assertAlertmanagerConfigMutationAllowed({ granted: true })).not.toThrow();
  });

  it('throws for a missing permission', () => {
    expect(() =>
      assertAlertmanagerConfigMutationAllowed({
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.NotificationsWrite],
      })
    ).toThrow(PermissionDeniedError);
  });

  it('throws for an Alertmanager without a configuration API', () => {
    expect(() => assertAlertmanagerConfigMutationAllowed({ granted: false, cause: 'NOT_SUPPORTED' })).toThrow(
      UnsupportedOperationError
    );
  });
});
