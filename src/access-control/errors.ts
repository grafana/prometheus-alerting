/** Error thrown when an operation is blocked by the current user's permissions. */
export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

export function isPermissionDeniedError(error: unknown): error is PermissionDeniedError {
  return error instanceof PermissionDeniedError;
}

/** Error thrown when an operation is unavailable for the selected resource. */
export class UnsupportedOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedOperationError';
  }
}

export function isUnsupportedOperationError(error: unknown): error is UnsupportedOperationError {
  return error instanceof UnsupportedOperationError;
}
