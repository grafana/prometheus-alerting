import React from 'react';
import { render, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';

import { setCurrentUserPermissions } from '../../test/mocks/grafana-runtime';
import { AlertingPermission } from '../abilities';

import { ProtectedRoute } from './ProtectedRoute';
import { TestMemoryRouter } from '../../test/utils/test-wrapper';

describe('ProtectedRoute', () => {
  it('mounts child routes when all required permissions are granted', () => {
    setCurrentUserPermissions(AlertingPermission.RulesWrite);

    render(
      <TestMemoryRouter initialEntries={['/rules/new']}>
        <Routes>
          <Route element={<ProtectedRoute requirements={[AlertingPermission.RulesWrite]} />}>
            <Route path="/rules/new" element={<div>New rule page</div>} />
          </Route>
        </Routes>
      </TestMemoryRouter>
    );

    expect(screen.getByText('New rule page')).toBeInTheDocument();
  });

  it('renders permission feedback without mounting the child route when a required permission is denied', () => {
    render(
      <TestMemoryRouter initialEntries={['/rules']}>
        <Routes>
          <Route element={<ProtectedRoute requirements={[AlertingPermission.RulesRead]} />}>
            <Route path="/rules" element={<div>Rules page</div>} />
          </Route>
        </Routes>
      </TestMemoryRouter>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Permission denied');
    expect(screen.queryByText('Rules page')).not.toBeInTheDocument();
  });
});
