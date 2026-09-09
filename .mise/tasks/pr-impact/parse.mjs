#!/usr/bin/env node
//MISE description="Turn the report Claude wrote into a rating, a summary and a list of spots"

// Reads the report Claude wrote and pulls three things out of it: the rating,
// the summary to post as a comment, and the file/line/reason triples to turn
// into inline review comments.
//
// A missing or unreadable rating fails, rather than quietly picking a tier —
// the action exits 0 whenever Claude finishes, even if it decided nothing.
// The Spot lines are best effort by comparison: a malformed one is dropped.

import { readFileSync } from 'node:fs';
import { setOutput, env, isMain } from './lib.mjs';

const TIERS = new Set(['trivial', 'low', 'medium', 'high']);
const MAX_SPOTS = 8;

/**
 * Claude writes its findings to a file rather than saying them: a few labelled
 * lines, a blank line, then the summary.
 *
 * The blank line is what makes this reliable. Everything below it is the
 * summary and is never looked at, so it can hold headings, code fences, the
 * word "Impact:", anything — none of it can be mistaken for a finding. Reading
 * the findings out of Claude's chat message, which is what this used to do,
 * meant prose and data shared one channel and kept colliding.
 */
export function parseReport(text) {
  const lines = text.split('\n').map((line) => line.replace(/\r$/, ''));
  const blank = lines.findIndex((line) => line.trim() === '');
  const labelled = blank === -1 ? lines : lines.slice(0, blank);

  const body =
    blank === -1
      ? ''
      : lines
          .slice(blank + 1)
          .join('\n')
          .trim()
          .slice(0, 4000);

  const impact = labelled
    .map((line) => /^impact:\s*(\w+)\s*$/i.exec(line))
    .filter(Boolean)
    .map((match) => match[1].toLowerCase())
    .filter((tier) => TIERS.has(tier));
  const rating = impact.at(-1) ?? null;

  const spots = labelled
    .filter((line) => /^spot:/i.test(line))
    .slice(0, MAX_SPOTS)
    .map((line) =>
      line
        .replace(/^spot:\s*/i, '')
        .split('|')
        .map((part) => part.trim())
    )
    .filter((parts) => parts.length >= 4)
    .map(([tier, path, line, ...why]) => ({
      tier: tier.toLowerCase(),
      path,
      line: Number(line),
      why: why.join(' '),
    }))
    .filter(
      (spot) =>
        Number.isInteger(spot.line) &&
        spot.line > 0 &&
        (spot.tier === 'medium' || spot.tier === 'high') &&
        spot.path !== '' &&
        spot.why !== ''
    );

  return { rating, body, spots };
}

/** How long the run took, for a reader rather than a parser: 48s, 2m 05s. */
export function humanDuration(ms) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return '';
  }
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ${String(seconds % 60).padStart(2, '0')}s`;
  }
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

function lastResult(executionFile) {
  const transcript = JSON.parse(readFileSync(executionFile, 'utf8'));
  return transcript.filter((entry) => entry.type === 'result').at(-1);
}

/**
 * Which model actually answered. The transcript records usage per concrete
 * model id, which is more use for tracking than the alias we asked for, but the
 * shape is not guaranteed — fall back to what the workflow requested.
 */
function modelUsed(result) {
  const usage = result?.modelUsage;
  const named = usage && typeof usage === 'object' ? Object.keys(usage) : [];
  return named.length > 0 ? named.join(', ') : (process.env.CLAUDE_MODEL ?? '');
}

if (isMain(import.meta.url)) {
  const { rating, body, spots } = parseReport(readFileSync(env('REPORT_FILE'), 'utf8'));

  if (!rating) {
    console.error(`No Impact line at the top of ${env('REPORT_FILE')}.`);
    process.exit(1);
  }

  // Timings and the model still come from the action's own transcript.
  const result = process.env.EXECUTION_FILE ? lastResult(process.env.EXECUTION_FILE) : undefined;

  console.error(`Claude rated this ${rating}, with ${spots.length} spot(s) to check`);
  setOutput({
    tier: rating,
    spots: JSON.stringify(spots),
    body,
    model: modelUsed(result),
    took: humanDuration(result?.duration_ms),
  });
}
