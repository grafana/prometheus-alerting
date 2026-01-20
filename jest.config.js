// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

const path = require('path');
const { grafanaESModules, nodeModulesToTransform } = require('./.config/jest/utils');

// Additional ESM packages that need to be transformed
const additionalESModules = [
  'yaml', // yaml package uses ESM exports
  'msw', // MSW uses ESM exports
  '@mswjs',
  'undici', // fetch polyfill for MSW
  'until-async', // async utility used by MSW
];

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...require('./.config/jest.config'),
  // Use jest-fixed-jsdom for MSW 2.x compatibility (provides native fetch, Response, etc.)
  testEnvironment: 'jest-fixed-jsdom',
  // Override transformIgnorePatterns to include additional ESM packages
  transformIgnorePatterns: [nodeModulesToTransform([...grafanaESModules, ...additionalESModules])],
  // Add module name mappers for MSW and its dependencies (ESM to CJS resolution)
  moduleNameMapper: {
    ...require('./.config/jest.config').moduleNameMapper,
    // Map MSW ESM exports to CJS equivalents for Jest
    '^msw/node$': '<rootDir>/node_modules/msw/lib/node/index.js',
    '^msw$': '<rootDir>/node_modules/msw/lib/core/index.js',
    // Map @mswjs/interceptors submodules
    '^@mswjs/interceptors/ClientRequest$':
      '<rootDir>/node_modules/@mswjs/interceptors/lib/node/interceptors/ClientRequest/index.js',
    '^@mswjs/interceptors/XMLHttpRequest$':
      '<rootDir>/node_modules/@mswjs/interceptors/lib/browser/interceptors/XMLHttpRequest/index.js',
    '^@mswjs/interceptors/fetch$': '<rootDir>/node_modules/@mswjs/interceptors/lib/node/interceptors/fetch/index.js',
    '^@mswjs/interceptors$': '<rootDir>/node_modules/@mswjs/interceptors/lib/node/index.js',
  },
};
