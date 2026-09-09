#!/usr/bin/env node
//MISE description="Apply the impact label, upsert the summary comment and leave inline review comments"

// The only part that writes, and it writes deterministically. Claude produced
// the rating and the spots without ever holding a token that can write;
// everything here is plain code working from that output.
//
// Set DRY_RUN=1 to print what would be posted instead of posting it.

import { gh, ghJson, ghPaginate, env, isMain, rank, TIERS } from './lib.mjs';

const SUMMARY_MARKER = '<!-- pr-impact -->';
const SPOT_MARKER = '<!-- pr-impact-spot -->';

// One four-step ramp, used the same way everywhere: the label colour, the emoji
// in the summary, and the prefix on each inline comment. The label names stay
// plain (`impact:medium`, no emoji) so a future merge gate can match on them.
const STYLE = {
  trivial: { emoji: '🟢', colour: '0E8A16', blurb: 'nothing that runs changes' },
  low: { emoji: '🟡', colour: 'FBCA04', blurb: 'you can see the change, but it works the same' },
  medium: { emoji: '🟠', colour: 'D4741F', blurb: 'something works differently now, in one part of the app' },
  high: { emoji: '🔴', colour: 'B60205', blurb: 'if this is wrong, someone loses something real' },
};

/**
 * The whole scale with the current tier picked out, so someone seeing one of
 * these comments for the first time can tell where this PR sits without having
 * to know the scheme.
 */
function scale(tier) {
  return TIERS.map((name) => {
    const step = `${STYLE[name].emoji} ${name}`;
    return name === tier ? `**${step}**` : step;
  }).join(' · ');
}

/**
 * A comment we left, as opposed to one that merely quotes our marker. Anyone
 * who can push can post a comment containing the marker; without this check
 * that comment is the one we would keep rewriting, and a line could be muted by
 * pre-flagging it. Outside Actions the poster is a person, so the bot check
 * only applies where the bot is doing the posting.
 */
function oursAlone(comment, marker) {
  if (!comment.body?.includes(marker)) {
    return false;
  }
  return !process.env.GITHUB_ACTIONS || comment.user?.type === 'Bot';
}

/** The floor wins wherever it is higher than what Claude said. */
function resolveTier(claudeTier, floor) {
  return rank(claudeTier) < rank(floor) ? { tier: floor, overridden: true } : { tier: claudeTier, overridden: false };
}

/**
 * The line numbers a patch adds, which are the only ones an inline comment can
 * attach to. Hunk headers look like @@ -12,7 +12,9 @@, and the first +number is
 * where the new side of that hunk starts.
 */
function addedLines(patch) {
  const found = new Set();
  let line = 0;

  for (const text of (patch ?? '').split('\n')) {
    if (text.startsWith('@@')) {
      const match = /\+(\d+)/.exec(text);
      if (match) {
        line = Number(match[1]);
      }
    } else if (text.startsWith('\\')) {
      // "\ No newline at end of file" belongs to the line before it.
    } else if (text.startsWith('-')) {
      // Only on the old side of the diff.
    } else if (text.startsWith('+')) {
      found.add(line++);
    } else {
      line++;
    }
  }

  return found;
}

/**
 * Claude picks the lines, but it can misread a diff, and a review whose comments
 * do not all land on changed lines is rejected whole. So work out from the patch
 * itself which lines can take a comment, and drop anything else.
 */
function pickComments({ spots, files, alreadyFlagged }) {
  const addable = new Map(files.map((file) => [file.filename, addedLines(file.patch)]));

  return spots
    .filter((spot) => addable.get(spot.path)?.has(spot.line))
    .filter((spot) => !alreadyFlagged.has(`${spot.path}:${spot.line}`))
    .map((spot) => ({
      path: spot.path,
      line: spot.line,
      side: 'RIGHT',
      body: `${STYLE[spot.tier].emoji} **impact: ${spot.tier}** — ${spot.why.slice(0, 500)}\n\n${SPOT_MARKER}`,
    }));
}

/**
 * What the diff pass came to, said out loud. Silence would leave a reader
 * guessing whether nothing was found or nothing was looked at, and "nothing
 * stood out" is a different claim from "everything found was already said".
 */
function spotNote({ marked, offered, repeats }) {
  if (marked > 0) {
    return `Marked ${marked} place${marked === 1 ? '' : 's'} on the diff worth reading first.`;
  }
  if (offered === 0) {
    return 'Nothing in the diff stood out as needing a closer look.';
  }
  if (repeats === offered) {
    return 'Nothing new to mark on this commit — what stood out was already flagged on an earlier one.';
  }
  // Something was named but could not be placed on a changed line. Say only
  // that, rather than claiming a reason that might not be the real one.
  return 'Nothing new to mark on this commit.';
}

/** The footer line, listing only the facts that were actually available. */
function provenance({ repo, headSha, model, effort, took }) {
  // Linked to the commit, so a stale rating can be told apart from a current
  // one without hunting for the SHA in the timeline.
  const parts = [`commit [\`${headSha.slice(0, 7)}\`](https://github.com/${repo}/commit/${headSha})`];
  if (model) {
    parts.push(`model \`${model}\``);
  }
  if (effort) {
    parts.push(`effort \`${effort}\``);
  }
  if (took) {
    parts.push(`took ${took}`);
  }
  return parts.join(' \u00b7 ');
}

function summaryBody({ repo, tier, explanation, headSha, model, effort, took, marked, offered, repeats }) {
  return [
    SUMMARY_MARKER,
    '',
    `### ${STYLE[tier].emoji} Impact: ${tier}`,
    '',
    scale(tier),
    '',
    `_${STYLE[tier].blurb}_`,
    '',
    explanation,
    '',
    spotNote({ marked, offered, repeats }),
    '',
    `Advisory only — this does not change what is needed to merge.`,
    `Rated at ${provenance({ repo, headSha, model, effort, took })}.`,
    '',
  ].join('\n');
}

function applyLabel({ repo, pr, tier }) {
  try {
    gh([
      'label',
      'create',
      `impact:${tier}`,
      '--repo',
      repo,
      '--force',
      '--description',
      `PR impact: ${STYLE[tier].blurb}`,
      '--color',
      STYLE[tier].colour,
    ]);
  } catch {
    // Already there, or we cannot create labels. Adding it below will tell us.
  }

  try {
    gh(['pr', 'edit', String(pr), '--repo', repo, '--add-label', `impact:${tier}`]);
  } catch {
    console.error('Could not add the label; continuing so the comment still lands.');
  }

  // Drop any tier this PR was rated at before, so exactly one sticks.
  const current = new Set(
    ghJson(['pr', 'view', String(pr), '--repo', repo, '--json', 'labels']).labels.map((l) => l.name)
  );
  for (const other of TIERS) {
    if (other === tier || !current.has(`impact:${other}`)) {
      continue;
    }
    try {
      gh(['pr', 'edit', String(pr), '--repo', repo, '--remove-label', `impact:${other}`]);
    } catch {
      // Someone removed it in the meantime; nothing to do.
    }
  }
}

function upsertSummary({ repo, pr, body }) {
  const comments = ghPaginate(`repos/${repo}/issues/${pr}/comments`);
  const mine = comments.filter((comment) => oursAlone(comment, SUMMARY_MARKER)).at(-1);

  if (mine) {
    gh(['api', '-X', 'PATCH', `repos/${repo}/issues/comments/${mine.id}`, '-f', `body=${body}`]);
    console.error('Updated the existing summary comment.');
  } else {
    gh(['api', '-X', 'POST', `repos/${repo}/issues/${pr}/comments`, '-f', `body=${body}`]);
    console.error('Posted a new summary comment.');
  }
}

function leaveReview({ repo, pr, headSha, tier, comments }) {
  const review = {
    commit_id: headSha,
    event: 'COMMENT',
    body: `Rated ${STYLE[tier].emoji} **impact: ${tier}**. The comments below mark what is worth reading first.`,
    comments,
  };
  gh(['api', '-X', 'POST', `repos/${repo}/pulls/${pr}/reviews`, '--input', '-'], JSON.stringify(review));
  console.error(`Left ${comments.length} inline comment(s).`);
}

export function post({
  repo,
  pr,
  headSha,
  claudeTier,
  claudeBody,
  floor,
  floorReason,
  spots,
  model,
  effort,
  took,
  dryRun,
}) {
  const { tier, overridden } = resolveTier(claudeTier, floor);
  console.error(`Rating: ${tier}`);

  const explanation = overridden
    ? `${claudeBody}\n\nClaude rated this ${STYLE[claudeTier]?.emoji ?? ''} **${claudeTier}**, raised to ${STYLE[tier].emoji} **${tier}** because the PR ${floorReason}.`
    : claudeBody;
  const files = ghPaginate(`repos/${repo}/pulls/${pr}/files`);
  // Don't repeat the same point on the same line across pushes.
  const alreadyFlagged = new Set(
    ghPaginate(`repos/${repo}/pulls/${pr}/comments`)
      .filter((comment) => oursAlone(comment, SPOT_MARKER))
      .map((comment) => `${comment.path}:${comment.line ?? comment.original_line}`)
  );
  const comments = pickComments({ spots, files, alreadyFlagged });
  const repeats = spots.filter((spot) => alreadyFlagged.has(`${spot.path}:${spot.line}`)).length;

  const dropped = spots.length - comments.length;
  if (dropped > 0) {
    console.error(`Dropped ${dropped} spot(s): not on a changed line, or already flagged.`);
  }

  const summary = summaryBody({
    repo,
    tier,
    explanation,
    headSha,
    model,
    effort,
    took,
    marked: comments.length,
    offered: spots.length,
    repeats,
  });

  if (dryRun) {
    console.log(`--- would label: impact:${tier} ---`);
    console.log('--- would post this summary comment ---');
    console.log(summary);
    console.log('--- would leave these inline comments ---');
    console.log(
      comments.length === 0 ? '(none)' : comments.map((c) => `${c.path}:${c.line}  ${c.body.split('\n')[0]}`).join('\n')
    );
    return;
  }

  applyLabel({ repo, pr, tier });
  upsertSummary({ repo, pr, body: summary });

  if (comments.length === 0) {
    console.error('Nothing new to point at on the diff.');
    return;
  }
  leaveReview({ repo, pr, headSha, tier, comments });
}

if (isMain(import.meta.url)) {
  post({
    repo: env('GH_REPO'),
    pr: env('PR_NUMBER'),
    headSha: env('HEAD_SHA'),
    claudeTier: env('CLAUDE_TIER'),
    claudeBody: env('CLAUDE_BODY', ''),
    floor: env('FLOOR', 'trivial'),
    floorReason: env('FLOOR_REASON', ''),
    spots: JSON.parse(env('SPOTS', '[]')),
    model: env('MODEL', ''),
    effort: env('EFFORT', ''),
    took: env('TOOK', ''),
    dryRun: Boolean(process.env.DRY_RUN),
  });
}
