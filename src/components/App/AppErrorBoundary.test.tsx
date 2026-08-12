import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { logError } from '../../analytics';
import { AppErrorBoundary } from './AppErrorBoundary';

// Spy on the real module instead of replacing it – logError only reaches Faro when the host Grafana
// has its JavaScript agent enabled, so the genuine implementation is a no-op here.
vi.mock('../../analytics', { spy: true });

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
    <MemoryRouter initialEntries={[path]}>
      <NavigateToSilences />
      <AppErrorBoundary>
        <Routes>
          <Route path="/rules" element={<Exploding />} />
          <Route path="/silences" element={<p>Silences list</p>} />
        </Routes>
      </AppErrorBoundary>
    </MemoryRouter>
  );
}

describe('AppErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // React logs every error it hands to a boundary; that noise is expected here.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders its children while nothing throws', () => {
    renderAt('/silences');

    expect(screen.getByText('Silences list')).toBeInTheDocument();
    expect(vi.mocked(logError)).not.toHaveBeenCalled();
  });

  it('shows a fallback and reports the error when a page throws', () => {
    renderAt('/rules');

    expect(screen.getByText('An unexpected error happened')).toBeInTheDocument();
    expect(vi.mocked(logError)).toHaveBeenCalledWith(expect.objectContaining({ message: 'page blew up' }), {
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
