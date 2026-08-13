import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { setDataSourceSrv } from '@grafana/runtime';

import { mockMimirDs } from '../../../../test/fixtures/datasources';
import { createMockDataSourceSrv } from '../../../../test/mocks/grafana-runtime';

import { DataSourceSection } from './DataSourceSection';

const PROMETHEUS_PLUGIN_LOGO = 'public/app/plugins/datasource/prometheus/img/prometheus_logo.svg';

describe('DataSourceSection icon', () => {
  beforeEach(() => {
    setDataSourceSrv(createMockDataSourceSrv());
  });

  /**
   * The application normally comes from feature discovery, so a data source whose discovery failed
   * has none -- and used to render no icon at all, which made it hard to pick out of a list of
   * several. A `prometheus`-type data source is the common case: it could be Prometheus, Mimir, or
   * Cortex, and only discovery can say which.
   */
  it('falls back to the plugin logo when the application is unknown', () => {
    render(<DataSourceSection uid={mockMimirDs.uid} name="Test Mimir" error="discovery failed" />);

    expect(screen.getByRole('img', { name: 'Prometheus' })).toHaveAttribute('src', PROMETHEUS_PLUGIN_LOGO);
  });

  it('prefers the application logo over the plugin logo when the application is known', () => {
    render(<DataSourceSection uid={mockMimirDs.uid} name="Test Mimir" application="mimir" />);

    // A Mimir data source registers as plugin type `prometheus`, so falling back to the plugin logo
    // here would show it the Prometheus logo and mislabel it.
    expect(screen.getByRole('img', { name: 'Mimir' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Prometheus' })).not.toBeInTheDocument();
  });

  // The generic <Icon> fallback renders a bare <svg> with no accessible name, so the meaningful
  // assertion is the negative one: we must not emit an <img> with an empty src.
  it('renders no image when the data source has no plugin logo', () => {
    render(<DataSourceSection uid="unknown-uid" name="Gone" error="discovery failed" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gone' })).toBeInTheDocument();
  });
});
