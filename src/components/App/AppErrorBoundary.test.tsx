import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { logError } from '../../analytics';
import { AppErrorBoundary } from './AppErrorBoundary';
import { TestMemoryRouter } from '../../test/utils/test-wrapper';

// Spy on the real module instead of replacing it – logError only reaches Faro when the host Grafana
// has its JavaScript agent enabled, so the genuine implementation is a no-op here.
rs.mock('../../analytics', { spy: true });

function Exploding(): React.ReactElement {
  throw new Error('page blew up');
}

/** Stands in for Grafana's nav, which sits outside the plugin and so survives a broken page. */
function NavigateToSilences() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/silences')}>Silences</button>;
}

function renderAt(path: string) {
  return render(
    <TestMemoryRouter initialEntries={[path]}>
      <NavigateToSilences />
      <AppErrorBoundary>
        <Routes>
          <Route path="/rules" element={<Exploding />} />
          <Route path="/silences" element={<p>Silences list</p>} />
        </Routes>
      </AppErrorBoundary>
    </TestMemoryRouter>
  );
}

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    rs.clearAllMocks();
    // React logs every error it hands to a boundary; that noise is expected here.
    rs.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders its children while nothing throws', () => {
    renderAt('/silences');

    expect(screen.getByText('Silences list')).toBeInTheDocument();
    expect(rs.mocked(logError)).not.toHaveBeenCalled();
  });

  it('shows a fallback and reports the error when a page throws', () => {
    renderAt('/rules');

    expect(screen.getByText('An unexpected error happened')).toBeInTheDocument();
    expect(rs.mocked(logError)).toHaveBeenCalledWith(expect.objectContaining({ message: 'page blew up' }), {
      boundary: 'app-root',
    });
  });

  it('recovers when the user navigates away from the broken page', async () => {
    const user = userEvent.setup();
    renderAt('/rules');

    expect(screen.getByText('An unexpected error happened')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Silences' }));

    expect(screen.getByText('Silences list')).toBeInTheDocument();
    expect(screen.queryByText('An unexpected error happened')).not.toBeInTheDocument();
  });
});
