// Shared helpers for the pr-impact workflow.
//
// Not executable, like every file here except _default.mjs: mise turns any
// executable file under .mise/tasks into a task, and the only thing worth
// offering is the whole run, not the steps it is made of.

import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

/**
 * Run gh and hand back its stdout.
 *
 * execFileSync rather than execSync: the arguments go straight to the process,
 * so a file path or a branch name containing a quote can never turn into shell
 * syntax. Nothing here has to be escaped.
 */
export function gh(args, input) {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    input,
    maxBuffer: 64 * 1024 * 1024,
  });
}

export function ghJson(args, input) {
  return JSON.parse(gh(args, input));
}

/** Every page of a paginated endpoint, flattened into one array. */
export function ghPaginate(path) {
  return ghJson(['api', '--paginate', '--slurp', path]).flat();
}

export function env(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    if (fallback !== undefined) {
      return fallback;
    }
    console.error(`Set ${name}.`);
    process.exit(2);
  }
  return value;
}

/** True when this module is the file node was asked to run. */
export function isMain(url) {
  return Boolean(process.argv[1]) && url === pathToFileURL(process.argv[1]).href;
}

export const TIERS = ['trivial', 'low', 'medium', 'high'];

/** Anything unrecognised counts as the worst, so a typo can never fast-track. */
export function rank(tier) {
  const index = TIERS.indexOf(tier);
  return index === -1 ? TIERS.length - 1 : index;
}
