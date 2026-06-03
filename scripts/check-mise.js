#!/usr/bin/env node
// @ts-check
'use strict';

const BANNER = `
 __  __ ___ ____  _____   ____  _____ ___  _   _ ___ ____  _____ ____
|  \\/  |_ _/ ___|| ____| |  _ \\| ____/ _ \\| | | |_ _|  _ \\| ____|  _ \\
| |\\/| || |\\___ \\|  _|   | |_) |  _|| | | | | | || || |_) |  _| | | | |
| |  | || | ___) | |___  |  _ <| |__| |_| | |_| || ||  _ <| |___| |_| |
|_|  |_|___|____/|_____| |_| \\_\\_____\\__\\_\\\\___/|___|_| \\_\\_____|____/
`;

const path = require('path');
const execPath = process.execPath;
const isCI = process.env.CI === 'true';
// Use path-segment matching to avoid false positives from paths that merely
// contain the substring "mise" (e.g. a home dir like /home/promiseuser/...).
const miseManaged = execPath.split(path.sep).includes('mise');

if (!miseManaged && !isCI) {
  process.stderr.write(BANNER + '\n');
  process.stderr.write('  ⚠️  WARNING: This repo recommends using mise to manage Node and pnpm versions.\n');
  process.stderr.write(`  Node is running from: ${execPath}\n\n`);
  process.stderr.write('  For the best development experience, install mise: https://mise.jdx.dev\n');
  process.stderr.write('  Then run:\n');
  process.stderr.write('    mise trust && mise install\n\n');
  process.stderr.write('  Continuing anyway...\n\n');
}
