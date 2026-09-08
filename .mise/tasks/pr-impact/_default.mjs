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
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { computeFloor } from './floor.mjs';
import { parseMessage, humanDuration } from './parse.mjs';
import { post } from './post.mjs';
import { ghJson } from './lib.mjs';

const ALLOWED_TOOLS = 'Bash(gh pr view:*),Bash(gh pr diff:*),Read,Grep,Glob';
const PROMPT_PATH = fileURLToPath(new URL('../../../.github/prompts/pr-impact.md', import.meta.url));

// Same two lines the workflow prepends. Keep them in step, or a local run stops
// predicting what CI will do.
function buildPrompt({ repo, pr }) {
  return `Repository: ${repo}\nPR number: ${pr}\n\n${readFileSync(PROMPT_PATH, 'utf8')}`;
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
const model = process.env.CLAUDE_MODEL ?? 'claude-sonnet-5';
const startedAt = Date.now();
let message;
try {
  message = execFileSync(
    'claude',
    ['-p', buildPrompt({ repo, pr }), '--model', model, '--allowedTools', ALLOWED_TOOLS],
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
const { rating, body, spots } = parseMessage(message);
if (!rating) {
  console.error("No rating in Claude's output:");
  console.error(message);
  process.exit(1);
}
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
  effort: process.env.CLAUDE_EFFORT ?? '',
  took: humanDuration(Date.now() - startedAt),
  dryRun: !process.env.POST,
});

if (!process.env.POST) {
  console.error('\nNothing was posted. Re-run with POST=1 to post it for real.');
}
