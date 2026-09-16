#!/usr/bin/env node
//MISE description="Run the pr-impact unit tests: mise run pr-impact:check"

// Offline, no gh and no Claude — it only exercises the pure parts of post.mjs.
//
// The pattern is passed to node rather than expanded by a shell, because mise
// runs this file directly. Handing --test a bare directory makes it try to run
// every file in here, including the ones that are meant to be imported.

import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

try {
  execFileSync(process.execPath, ['--test', join(here, '*.test.mjs')], { stdio: 'inherit' });
} catch {
  process.exit(1);
}
