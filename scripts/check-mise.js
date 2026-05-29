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

const execPath = process.execPath;

if (!execPath.includes('mise')) {
  process.stderr.write(BANNER + '\n');
  process.stderr.write('  This repo requires mise to manage Node and pnpm versions.\n');
  process.stderr.write(`  Node is running from: ${execPath}\n\n`);
  process.stderr.write('  Please install mise: https://mise.jdx.dev\n');
  process.stderr.write('  Then run:\n');
  process.stderr.write('    mise trust && mise install\n\n');
  process.stderr.write('  See the README for setup instructions.\n\n');
  process.exit(1);
}
