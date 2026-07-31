import { AlertingPermission } from '../../../access-control/abilities';
import { getRouteAbilityErrorFeedback, getRouteMutationErrorFeedback } from './errorFeedback';

describe('route error feedback', () => {
  it('shows permission feedback for denied abilities and datasource 403s', () => {
    const deniedAbilityFeedback = getRouteAbilityErrorFeedback({
      granted: false,
      cause: 'INSUFFICIENT_PERMISSIONS',
      anyOfPermissions: [AlertingPermission.NotificationsWrite],
    });
    const forbiddenRequestFeedback = getRouteMutationErrorFeedback(
      { status: 403, data: { message: 'Forbidden' } },
      'Failed to update route'
    );

    expect(deniedAbilityFeedback).toEqual({
      title: 'Permission denied',
      description: 'You do not have permission to change routes for this data source.',
    });
    expect(forbiddenRequestFeedback).toEqual(deniedAbilityFeedback);
  });

  it('distinguishes unsupported configuration APIs from permission failures', () => {
    expect(
      getRouteAbilityErrorFeedback({
        granted: false,
        cause: 'NOT_SUPPORTED',
      })
    ).toEqual({
      title: 'Route changes unavailable',
      description: 'This Alertmanager does not support updating routes.',
    });
  });

  it('preserves existing feedback for non-permission request failures', () => {
    expect(
      getRouteMutationErrorFeedback({ status: 500, data: { message: 'Request failed' } }, 'Failed to update route')
    ).toEqual({
      title: 'Failed to update route',
      description: 'Request failed',
    });
  });
});
