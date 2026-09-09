#!/usr/bin/env node
//MISE description="Rate a PR locally with the same prompt CI uses: mise run pr-impact 123"

// Runs the whole thing against a real PR without pushing anything, so the prompt
// in .github/prompts/pr-impact.md can be edited and tried in a loop. It prints
// what it would post; set POST=1 to actually post it.
//
// This drives your local `claude` CLI rather than claude-code-action, so the
// model and the tool permissions are repeated here to match what the workflow
// passes. Everything else — the prompt, the floor, the parsing, the posting — is
// the same code CI runs.

import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { computeFloor } from './floor.mjs';
import { readTier, readSpots, humanDuration } from './parse.mjs';
import { post } from './post.mjs';
import { ghJson } from './lib.mjs';

// Claude writes its findings to these rather than saying them. Same names CI uses.
const FILES = {
  tier: 'pr-impact-tier.txt',
  spots: 'pr-impact-spots.tsv',
  summary: 'pr-impact-summary.md',
};
const ALLOWED_TOOLS = ['Read', 'Grep', 'Glob', ...Object.values(FILES).map((f) => `Edit(${f})`)].join(',');
const PROMPT_PATH = fileURLToPath(new URL('../../../.github/prompts/pr-impact.md', import.meta.url));
// Matches the cap in the workflow. Keep the two in step, or a local run stops
// predicting what CI will do.
const DIFF_LIMIT = 120000;

// Same two lines the workflow prepends. Keep them in step, or a local run stops
// predicting what CI will do.
let diffWasCut = false;

function buildPrompt({ repo, pr }) {
  const diff = execFileSync('gh', ['pr', 'diff', String(pr), '--repo', repo], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const cut = diff.length > DIFF_LIMIT;
  diffWasCut = cut;

  return [
    readFileSync(PROMPT_PATH, 'utf8'),
    `Repository: ${repo}`,
    `PR number: ${pr}`,
    '',
    cut ? 'The diff follows.\nIt was too long to include whole, so it stops part way through.' : 'The diff follows.',
    '',
    diff.slice(0, DIFF_LIMIT),
    '',
  ].join('\n');
}

const pr = process.argv[2] ?? process.env.PR_NUMBER;
if (!pr) {
  console.error('Usage: mise run pr-impact <pr-number>');
  process.exit(2);
}

const repo = process.env.GH_REPO ?? ghJson(['repo', 'view', '--json', 'nameWithOwner']).nameWithOwner;

console.error('==> Working out the floor');
const { floor, reason } = computeFloor({ repo, pr });
console.error(`    floor: ${floor}${reason ? ` (${reason})` : ''}`);

console.error('==> Asking Claude');
for (const f of Object.values(FILES)) {
  rmSync(f, { force: true });
}
const model = process.env.CLAUDE_MODEL ?? 'claude-sonnet-5';
// Defaulted to match the workflow, and passed to the CLI below rather than only
// reported: the footer is there to be trusted.
const effort = process.env.CLAUDE_EFFORT ?? 'medium';
const startedAt = Date.now();
let message;
try {
  message = execFileSync(
    'claude',
    ['-p', buildPrompt({ repo, pr }), '--model', model, '--effort', effort, '--allowedTools', ALLOWED_TOOLS],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 32 * 1024 * 1024 }
  );
} catch (error) {
  if (error.code === 'ENOENT') {
    console.error('The claude CLI is not on PATH. See https://claude.com/claude-code');
    process.exit(1);
  }
  throw error;
}

console.error('==> Reading the rating');
let files;
try {
  files = Object.fromEntries(Object.entries(FILES).map(([name, path]) => [name, readFileSync(path, 'utf8')]));
} catch (error) {
  console.error(`Claude did not write ${error.path ?? 'one of the report files'}. What it said instead:`);
  console.error(message);
  process.exit(1);
} finally {
  for (const f of Object.values(FILES)) {
    rmSync(f, { force: true });
  }
}

const rating = readTier(files.tier);
if (!rating) {
  console.error(`${FILES.tier} held "${files.tier.trim()}", which is not a tier.`);
  process.exit(1);
}
const spots = readSpots(files.spots);
const body = files.summary.trim();
console.error(`    ${rating}, with ${spots.length} spot(s) to check`);

console.error('==> Posting');
post({
  repo,
  pr,
  headSha: ghJson(['pr', 'view', String(pr), '--repo', repo, '--json', 'headRefOid']).headRefOid,
  claudeTier: rating,
  claudeBody: body,
  floor,
  floorReason: reason,
  spots,
  model,
  effort,
  took: humanDuration(Date.now() - startedAt),
  truncated: diffWasCut,
  dryRun: !process.env.POST,
});

if (!process.env.POST) {
  console.error('\nNothing was posted. Re-run with POST=1 to post it for real.');
}
