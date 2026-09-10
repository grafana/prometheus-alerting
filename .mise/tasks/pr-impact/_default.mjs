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
import { fileURLToPath } from 'node:url';
import { computeFloor } from './floor.mjs';
import { readFindings, humanDuration } from './parse.mjs';
import { buildPrompt } from './prompt.mjs';
import { post } from './post.mjs';
import { ghJson } from './lib.mjs';

const ALLOWED_TOOLS = 'Read,Grep,Glob';
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
const { text: prompt, truncated } = buildPrompt({ repo, pr });
const model = process.env.CLAUDE_MODEL ?? 'claude-sonnet-5';
// Defaulted to match the workflow, and passed to the CLI below rather than only
// reported: the footer is there to be trusted.
const effort = process.env.CLAUDE_EFFORT ?? 'medium';
const startedAt = Date.now();
let message;
try {
  message = execFileSync(
    'claude',
    ['-p', prompt, '--model', model, '--effort', effort, '--allowedTools', ALLOWED_TOOLS],
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
const { tier: rating, spots, summary: body } = readFindings(message);
if (!rating) {
  console.error('No IMPACT line at the end of what Claude said. It said:');
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
  reason,
  spots,
  model,
  effort,
  took: humanDuration(Date.now() - startedAt),
  truncated,
  dryRun: !process.env.POST,
});

if (!process.env.POST) {
  console.error('\nNothing was posted. Re-run with POST=1 to post it for real.');
}
