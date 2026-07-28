import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import { AlertingPermission } from '../abilities';

import { ProtectedRoute } from './ProtectedRoute';

const mockHasAllPermissions = vi.fn();

vi.mock('@grafana/runtime', () => {
  return {
    hasAllPermissions: (...args: unknown[]) => mockHasAllPermissions(...args),
  };
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockHasAllPermissions.mockReset();
  });

  it('mounts child routes when all required permissions are granted', () => {
    mockHasAllPermissions.mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={['/rules/new']}>
        <Routes>
          <Route element={<ProtectedRoute requirements={[AlertingPermission.RulesWrite]} />}>
            <Route path="/rules/new" element={<div>New rule page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('New rule page')).toBeInTheDocument();
  });

  it('renders permission feedback without mounting the child route when a required permission is denied', () => {
    mockHasAllPermissions.mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={['/rules']}>
        <Routes>
          <Route element={<ProtectedRoute requirements={[AlertingPermission.RulesRead]} />}>
            <Route path="/rules" element={<div>Rules page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Permission denied');
    expect(screen.queryByText('Rules page')).not.toBeInTheDocument();
  });
});
