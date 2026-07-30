import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { setCurrentUserPermissions } from '../../test/mocks/grafana-runtime';
import { AlertingPermission } from '../abilities';

import { ProtectedRoute } from './ProtectedRoute';

describe('ProtectedRoute', () => {
  it('mounts child routes when all required permissions are granted', () => {
    setCurrentUserPermissions(AlertingPermission.RulesWrite);

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
