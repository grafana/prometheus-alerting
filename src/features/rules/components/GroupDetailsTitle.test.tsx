import React from 'react';
import { render, screen } from '@testing-library/react';
import { GroupDetailsTitle } from './GroupDetailsTitle';
import { TestMemoryRouter } from '../../../test/utils/test-wrapper';

describe('GroupDetailsTitle', () => {
  it('renders the group name', () => {
    render(
      <TestMemoryRouter>
        <GroupDetailsTitle name="my-group" />
      </TestMemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'my-group' })).toBeInTheDocument();
  });

  it('renders back button linking to rules list', () => {
    render(
      <TestMemoryRouter>
        <GroupDetailsTitle name="my-group" />
      </TestMemoryRouter>
    );

    const backButton = screen.getByRole('link', { name: /back to rules list/i });
    expect(backButton).toBeInTheDocument();
    expect(backButton).toHaveAttribute('href', expect.stringContaining('/rules'));
  });
});
