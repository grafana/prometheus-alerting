import { AlertingPermission } from './abilities';
import { getSilencesAbilities, SilenceAction } from './abilities.silences';
import { setCurrentUserPermissions } from '../test/mocks/grafana-runtime';

describe('getSilencesAbilities', () => {
  it('denies both actions without instance permissions', () => {
    setCurrentUserPermissions();

    expect(getSilencesAbilities()).toEqual({
      [SilenceAction.ViewSilences]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.InstancesRead],
      },
      [SilenceAction.MutateSilences]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.InstancesWrite],
      },
    });
  });

  it('grants reads without granting mutations for a read-only user', () => {
    setCurrentUserPermissions(AlertingPermission.InstancesRead);

    expect(getSilencesAbilities()).toEqual({
      [SilenceAction.ViewSilences]: { granted: true },
      [SilenceAction.MutateSilences]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.InstancesWrite],
      },
    });
  });

  it('grants both actions for a user with instance write permissions', () => {
    setCurrentUserPermissions(AlertingPermission.InstancesRead, AlertingPermission.InstancesWrite);

    expect(getSilencesAbilities()).toEqual({
      [SilenceAction.ViewSilences]: { granted: true },
      [SilenceAction.MutateSilences]: { granted: true },
    });
  });
});
