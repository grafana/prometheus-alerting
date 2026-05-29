import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GroupDetailsTitle } from './GroupDetailsTitle';

describe('GroupDetailsTitle', () => {
  it('renders the group name', () => {
    render(
      <MemoryRouter>
        <GroupDetailsTitle name="my-group" />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'my-group' })).toBeInTheDocument();
  });

  it('renders back button linking to rules list', () => {
    render(
      <MemoryRouter>
        <GroupDetailsTitle name="my-group" />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('link', { name: /back to rules list/i });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute('href', expect.stringContaining('/rules'));
  });
});
