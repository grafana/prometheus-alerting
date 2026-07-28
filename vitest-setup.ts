/// <reference types="vitest/globals" />

// Vitest setup file
import React from 'react';
import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Import MSW server
import { server } from './src/test/server';

// Import mocks
import {
  loadMockDataSourceSettings,
  setupGrafanaRuntimeMocks,
  resetGrafanaRuntimeMocks,
} from './src/test/mocks/grafana-runtime';

// Import handler reset functions
import { resetRulerState } from './src/test/handlers/ruler';
import { resetMimirAlertmanagerState } from './src/test/handlers/mimir-alertmanager';
import { resetVanillaAlertmanagerState } from './src/test/handlers/alertmanager';

/**
 * React InlineSVG Mock
 * Due to the @grafana/ui Icon component making fetch requests to
 * `/public/img/icon/<icon_name>.svg` we need to mock react-inlinesvg to prevent
 * the failed fetch requests from displaying errors in console.
 */
vi.mock('react-inlinesvg', () => {
  return {
    default: ({ src }: { src: string }) => {
      // testId will be the file name without extension (e.g. `public/img/icons/angle-double-down.svg` -> `angle-double-down`)
      const SVG_FILE_NAME_REGEX = /(.+)\/(.+)\.svg$/;
      const testId = src.replace(SVG_FILE_NAME_REGEX, '$2');
      return React.createElement('svg', {
        xmlns: 'http://www.w3.org/2000/svg',
        'data-testid': testId,
        viewBox: '0 0 24 24',
      });
    },
  };
});

/**
 * ResizeObserver Mock
 * Required for @grafana/ui components that use ResizeObserver (e.g. TruncatedText).
 * vi.fn().mockImplementation is not constructable with `new` in Vitest 4.x, so we
 * use a proper class instead.
 */
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

/**
 * Canvas Mock
 * Required for @grafana/ui components that use measureText
 * Happy DOM provides HTMLCanvasElement but we need to mock getContext for testing
 */
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    measureText: vi.fn(() => ({ width: 100 })),
    fillText: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: [] })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => []),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  })) as any;
}

/**
 * MSW Server Lifecycle
 *
 * The server starts before all tests and closes after all tests.
 * Handlers are reset after each test to ensure isolation.
 */
beforeAll(async () => {
  // Start MSW server
  server.listen({
    // Only warn about unhandled requests to our API routes
    // Bypass other requests (like asset loading) to prevent ECONNREFUSED errors
    onUnhandledRequest(request, print) {
      // Only warn about API requests we should be handling
      if (request.url.includes('/api/')) {
        print.warning();
      }
      // Silently bypass everything else (assets, etc.)
    },
  });

  await loadMockDataSourceSettings();
});

afterEach(() => {
  // Reset MSW handlers to defaults (removes test-specific overrides)
  server.resetHandlers();

  // Reset any stateful mock data
  resetRulerState();
  resetMimirAlertmanagerState();
  resetVanillaAlertmanagerState();
  resetGrafanaRuntimeMocks();
});

afterAll(() => {
  // Clean up MSW server
  server.close();
});

// Set up Grafana runtime mocks (config.datasources, getDataSourceSrv, etc.)
setupGrafanaRuntimeMocks();
