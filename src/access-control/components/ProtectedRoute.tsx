import React from 'react';
import { Outlet } from 'react-router-dom';
import { hasAllPermissions } from '@grafana/runtime';

import { AlertingPermission } from '../abilities';

import { PermissionDenied } from './PermissionDenied';

interface ProtectedRouteProps {
  /** The user must have permission for every requirement (AND semantics). */
  requirements: AlertingPermission[];
}

/** A pathless layout route that prevents its child route elements from mounting when permission is denied. */
export function ProtectedRoute({ requirements }: ProtectedRouteProps) {
  if (!hasAllPermissions(requirements)) {
    return <PermissionDenied />;
  }

  return <Outlet />;
}
