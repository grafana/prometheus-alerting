import { Ability } from './abilities';
import { PermissionDeniedError, UnsupportedOperationError } from './errors';

const ERR_INSUFFICIENT_PERMISSIONS = new PermissionDeniedError(
  'Missing permission to update the Alertmanager configuration'
);
const ERR_CONFIGURATION_API_NOT_SUPPORTED = new UnsupportedOperationError(
  'The selected Alertmanager does not support configuration updates'
);

/**
 * Throws if the Alertmanager configuration cannot be written to. This is the enforcement boundary
 * for configuration writes: callers that hide their buttons still cannot reach the API.
 */
export function assertAlertmanagerConfigMutationAllowed(ability: Ability): void {
  if (ability.granted) {
    return;
  }

  switch (ability.cause) {
    case 'INSUFFICIENT_PERMISSIONS':
      throw ERR_INSUFFICIENT_PERMISSIONS;
    case 'NOT_SUPPORTED':
      throw ERR_CONFIGURATION_API_NOT_SUPPORTED;
    default:
      // A cause added later must not quietly fall through into the mutation.
      throw ERR_CONFIGURATION_API_NOT_SUPPORTED;
  }
}
