import { defineConfig } from 'vitest/config';

import { swcBuildTarget } from './.config/vitest.swc';

export default defineConfig({
  plugins: [swcBuildTarget()],
  test: {
    environment: 'happy-dom',
    pool: 'forks',
    fileParallelism: false,
    maxWorkers: 1,
    benchmark: {
      include: ['src/**/*.bench.ts'],
    },
  },
  ssr: {
    noExternal: [/@grafana\/.*/, /rxjs/],
  },
});
