import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { GroupDetailsTitle } from './GroupDetailsTitle';

// Mock ResizeObserver which is not available in jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('GroupDetailsTitle', () => {
  it('renders the group name', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <GroupDetailsTitle name="my-group" />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'my-group' })).toBeInTheDocument();
  });

  it('renders back button linking to rules list', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <GroupDetailsTitle name="my-group" />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('link', { name: /back to rules list/i });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute('href', expect.stringContaining('/rules'));
  });
});
