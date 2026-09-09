#!/usr/bin/env node
//MISE description="Turn Claude's final message into a rating, a rationale and a list of spots"

// Pulls three things out of Claude's last message: the rating, the prose to post
// as a comment, and the file/line/reason triples to turn into inline review
// comments.
//
// A missing or unreadable rating fails, rather than quietly picking a tier — the
// action exits 0 whenever Claude finishes, even if it decided nothing. The SPOT
// lines are best effort by comparison: a malformed one is dropped.
//
// Takes either EXECUTION_FILE (the JSON transcript claude-code-action leaves
// behind) or MESSAGE (the final message as plain text), so the same parsing runs
// in CI and when iterating locally.

import { readFileSync } from 'node:fs';
import { setOutput, env, isMain } from './lib.mjs';

const RATING = /^IMPACT: (trivial|low|medium|high)\s*$/;
const SPOT = 'SPOT: ';
const MAX_SPOTS = 8;

// Claude is asked for three parts and sometimes labels them, or wraps the spot
// lines in a code fence. Once the SPOT lines are pulled out, that leaves headings
// and an empty fence sitting in what should be plain prose, so take them out too.
const PART_LABEL = /^(?:#{1,6}\s*)?(?:\*\*)?\d+\.\s*\w+\s*(?:\*\*)?:?$/;
const FENCE = /^```\w*$/;

function prose(lines) {
  const kept = lines.filter((line) => !/^(IMPACT|SPOT): /.test(line) && !PART_LABEL.test(line.trim()));

  // Drop fences that now have nothing between them.
  const out = [];
  for (let i = 0; i < kept.length; i++) {
    if (FENCE.test(kept[i].trim())) {
      let j = i + 1;
      while (j < kept.length && kept[j].trim() === '') {
        j++;
      }
      if (j < kept.length && FENCE.test(kept[j].trim())) {
        i = j;
        continue;
      }
    }
    out.push(kept[i]);
  }

  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 4000);
}

export function parseMessage(message) {
  const lines = message.split('\n').map((line) => line.replace(/\r$/, ''));

  const rated = lines.filter((line) => RATING.test(line));
  const rating = rated.length > 0 ? RATING.exec(rated.at(-1))[1] : null;

  const body = prose(lines);

  const spots = lines
    .filter((line) => line.startsWith(SPOT))
    .slice(0, MAX_SPOTS)
    .map((line) =>
      line
        .slice(SPOT.length)
        .split('|')
        .map((part) => part.trim())
    )
    .filter((parts) => parts.length >= 4)
    .map(([tier, path, line, ...why]) => ({ tier, path, line: Number(line), why: why.join(' ') }))
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
  const result = process.env.MESSAGE ? undefined : lastResult(env('EXECUTION_FILE'));
  const message = process.env.MESSAGE || (result?.result ?? '');
  const { rating, body, spots } = parseMessage(message);

  if (!rating) {
    console.error("No rating in Claude's output:");
    console.error(message);
    process.exit(1);
  }

  console.error(`Claude rated this ${rating}, with ${spots.length} spot(s) to check`);
  setOutput({
    tier: rating,
    spots: JSON.stringify(spots),
    body,
    model: modelUsed(result),
    took: humanDuration(result?.duration_ms),
  });
}
