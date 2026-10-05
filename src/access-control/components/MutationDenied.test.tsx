import React from 'react';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from '@rstest/core';

import { AlertingPermission } from '../abilities';
import { MutationDenied } from './MutationDenied';

describe('MutationDenied', () => {
  it('says the user lacks permission', () => {
    render(
      <MutationDenied
        ability={{
          granted: false,
          cause: 'INSUFFICIENT_PERMISSIONS',
          anyOfPermissions: [AlertingPermission.NotificationsWrite],
        }}
        resource="receivers"
      />
    );

    expect(screen.getByText('Permission denied')).toBeInTheDocument();
  });

  it('says the Alertmanager cannot do it', () => {
    render(<MutationDenied ability={{ granted: false, cause: 'NOT_SUPPORTED' }} resource="receivers" />);

    expect(screen.getByText('Configuration changes unavailable')).toBeInTheDocument();
    expect(screen.getByText('This Alertmanager does not support updating receivers.')).toBeInTheDocument();
  });

  it('shows a placeholder while the ability is still being worked out', () => {
    render(<MutationDenied ability={{ granted: false, cause: 'LOADING' }} resource="receivers" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('falls back to unavailable when the ability check failed', () => {
    render(
      <MutationDenied ability={{ granted: false, cause: 'ERROR', error: new Error('boom') }} resource="receivers" />
    );

    expect(screen.getByText('Configuration changes unavailable')).toBeInTheDocument();
  });
});
