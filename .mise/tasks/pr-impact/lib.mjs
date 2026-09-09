// Shared helpers for the pr-impact workflow.
//
// Not executable, like every file here except _default.mjs: mise turns any
// executable file under .mise/tasks into a task, and the only thing worth
// offering is the whole run, not the steps it is made of.

import { appendFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
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

/**
 * Actions passes values between steps through a file. These tasks only ever run
 * as workflow steps, so if that file is missing something is wrong: stop, rather
 * than print the values somewhere nothing is reading and look like it worked.
 *
 * The delimiter is random per value and never a fixed string. Some of what we
 * write here is Claude's own words, and Claude has read the diff, which anyone
 * opening a PR controls. With a predictable delimiter, a diff could talk the
 * model into printing it: the value ends early and everything after it is
 * parsed as further step outputs, including a second, lower `tier` that wins by
 * being last.
 */
export function setOutput(values) {
  const text =
    Object.entries(values)
      .map(([key, raw]) => {
        const value = String(raw);
        if (!value.includes('\n')) {
          return `${key}=${value}`;
        }
        const delimiter = `EOF_${randomUUID().replaceAll('-', '')}`;
        return `${key}<<${delimiter}\n${value}\n${delimiter}`;
      })
      .join('\n') + '\n';

  if (!process.env.GITHUB_OUTPUT) {
    console.error(
      'GITHUB_OUTPUT is not set. This file is a CI step; to rate a PR locally, run: mise run pr-impact <number>'
    );
    process.exit(2);
  }
  appendFileSync(process.env.GITHUB_OUTPUT, text);
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
