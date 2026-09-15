// A step of the pr-impact workflow, run by .github/workflows/pr-impact.yml.
// Not executable, so mise offers only the one task — `mise run pr-impact
// <number>` — rather than each step separately.
//
// The only part that writes, and it writes deterministically. Claude produced
// the rating and the spots without ever holding a token that can write;
// everything here is plain code working from that output.
//
// Every run says everything it has to say. Claude is handed the whole PR diff
// each time, not just the newest commit, so the latest answer is a complete
// read of the PR rather than an addition to earlier ones. That is why this
// resolves the inline comments from earlier runs and posts the current round
// fresh, instead of trying to work out which of the new points were already
// made. Matching new text against old text only ever half worked: Claude
// rewords, so a reworded repeat came out twice, and it sat there for good if
// the line under it never changed again.
//
// Set DRY_RUN=1 to print what would be posted instead of posting it.

import { gh, ghJson, ghPaginate, env, isMain, rank, TIERS } from './lib.mjs';
import { computeFloor } from './floor.mjs';

const SUMMARY_MARKER = '<!-- pr-impact -->';
const SPOT_MARKER = '<!-- pr-impact-spot -->';

// Said on every summary. The inline comments are a round rather than a running
// list, so a reader who finds a stack of resolved threads above should know
// that is how it works and not somebody tidying up after the bot.
const ROUND_NOTE =
  'Every run rates the whole PR again, so the open inline comments are this round and earlier rounds are resolved.';

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
 * Whether a comment carrying our marker was really left by us. Anyone who can
 * push can post a comment containing the marker; without this check that
 * comment is the one we would keep rewriting, and a spot could be muted by
 * pre-flagging its line. Outside Actions the poster is a person, so the bot
 * check only applies where the bot is doing the posting.
 */
function postedByUs(isBot) {
  return !process.env.GITHUB_ACTIONS || isBot;
}

/** A comment we left, as opposed to one that merely quotes our marker. */
function oursAlone(comment, marker) {
  return Boolean(comment.body?.includes(marker)) && postedByUs(comment.user?.type === 'Bot');
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
export function pickComments({ spots, files }) {
  const addable = new Map(files.map((file) => [file.filename, addedLines(file.patch)]));
  // Claude sometimes makes the very same point at two places in one answer.
  const said = new Set();

  return spots
    .filter((spot) => addable.get(spot.path)?.has(spot.line))
    .filter((spot) => {
      const key = `${spot.path}\n${spot.why}`;
      if (said.has(key)) {
        return false;
      }
      said.add(key);
      return true;
    })
    .map((spot) => ({
      path: spot.path,
      line: spot.line,
      side: 'RIGHT',
      body: `${STYLE[spot.tier].emoji} **impact: ${spot.tier}** — ${spot.why.slice(0, 500)}\n\n${SPOT_MARKER}`,
    }));
}

// Review threads have to come from GraphQL: the REST list of review comments
// has no thread id, and a thread id is what resolving needs. The first comment
// in a thread is the one we wrote, so that is the only one worth asking for.
const THREADS_QUERY = `
query($owner:String!, $name:String!, $pr:Int!, $cursor:String) {
  repository(owner:$owner, name:$name) {
    pullRequest(number:$pr) {
      reviewThreads(first:100, after:$cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          isResolved
          comments(first:1) { totalCount nodes { body author { __typename } } }
        }
      }
    }
  }
}`;

const RESOLVE_MUTATION = `
mutation($thread:ID!) {
  resolveReviewThread(input:{threadId:$thread}) { thread { id } }
}`;

/** Every review thread on the PR, as GraphQL returns them. */
function reviewThreads({ repo, pr }) {
  const [owner, name] = repo.split('/');
  const nodes = [];
  let cursor = null;

  // Paged by hand rather than with `gh --paginate`, which for GraphQL wants the
  // cursor variable spelled its way. The loop is shorter than the explanation
  // of the flag would be. `cursor` is left out of the first call: a nullable
  // variable that isn't supplied reads as null, which is where paging starts.
  for (;;) {
    const args = [
      'api',
      'graphql',
      '-f',
      `query=${THREADS_QUERY}`,
      '-f',
      `owner=${owner}`,
      '-f',
      `name=${name}`,
      '-F',
      `pr=${pr}`,
    ];
    if (cursor) {
      args.push('-f', `cursor=${cursor}`);
    }

    const page = ghJson(args).data.repository.pullRequest.reviewThreads;
    nodes.push(...page.nodes);
    if (!page.pageInfo.hasNextPage) {
      return nodes;
    }
    cursor = page.pageInfo.endCursor;
  }
}

/**
 * The ids of our own open spot threads, which is what the current round
 * replaces.
 *
 * Resolving rather than deleting: a resolved thread folds out of the way but
 * keeps what was said under it. That is what lets this be unconditional —
 * nothing a person wrote is ever lost, so there is no need to work out which
 * old comments are safe to remove.
 *
 * A thread somebody has replied to is left open anyway. Someone is mid
 * conversation there and it is theirs to close, not ours to fold up under them.
 */
export function ourOpenThreads(threads, { onlyBot = Boolean(process.env.GITHUB_ACTIONS) } = {}) {
  return threads
    .filter((thread) => {
      const top = thread.comments?.nodes?.[0];
      if (thread.isResolved || !top?.body?.includes(SPOT_MARKER)) {
        return false;
      }
      // Only our own comment is in there, so nobody has replied.
      const alone = (thread.comments.totalCount ?? 1) === 1;
      return alone && (!onlyBot || top.author?.__typename === 'Bot');
    })
    .map((thread) => thread.id);
}

/**
 * What the diff pass came to, said out loud. Silence would leave a reader
 * guessing whether nothing was found or nothing was looked at.
 */
function spotNote({ marked, offered }) {
  if (marked > 0) {
    return `Marked ${marked} place${marked === 1 ? '' : 's'} on the diff worth reading first.`;
  }
  if (offered === 0) {
    return 'Nothing in the diff stood out as needing a closer look.';
  }
  // Something was named but could not be placed on a changed line. Say only
  // that, rather than claiming a reason that might not be the real one.
  return 'Nothing to mark on the lines this diff changes.';
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
  return parts.join(' · ');
}

function summaryBody({ repo, tier, explanation, headSha, model, effort, took, marked, offered }) {
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
    spotNote({ marked, offered }),
    ROUND_NOTE,
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

function resolveThreads({ ids }) {
  let done = 0;
  for (const id of ids) {
    try {
      gh(['api', 'graphql', '-f', `query=${RESOLVE_MUTATION}`, '-f', `thread=${id}`]);
      done++;
    } catch {
      // Gone, or we are not allowed to. Tidying up is not worth failing the run
      // over — the rating is the point.
    }
  }
  console.error(`Resolved ${done} inline comment thread(s) from an earlier run.`);
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
  reason: floorReason,
  spots,
  model,
  effort,
  took,
  truncated,
  dryRun,
}) {
  // A diff too long to include whole was rated on part of itself, and the part
  // left out is exactly where an unnoticed problem would be. Whatever the paths
  // said, that rating does not get to sit in the tiers we would fast-track.
  const [effectiveFloor, effectiveReason] =
    truncated && rank(floor) < rank('medium')
      ? ['medium', 'was too long to include whole, so it was rated on part of the diff']
      : [floor, floorReason];

  const { tier, overridden } = resolveTier(claudeTier, effectiveFloor);
  console.error(`Rating: ${tier}`);

  const explanation = overridden
    ? `${claudeBody}\n\nClaude rated this ${STYLE[claudeTier]?.emoji ?? ''} **${claudeTier}**, raised to ${STYLE[tier].emoji} **${tier}** because the PR ${effectiveReason}.`
    : claudeBody;
  const files = ghPaginate(`repos/${repo}/pulls/${pr}/files`);
  // Read before anything is posted, so the current round is never in the list
  // of what gets resolved.
  const superseded = ourOpenThreads(reviewThreads({ repo, pr }));
  const comments = pickComments({ spots, files });

  const dropped = spots.length - comments.length;
  if (dropped > 0) {
    console.error(`Dropped ${dropped} spot(s): not on a changed line, or said twice in one answer.`);
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
  });

  if (dryRun) {
    console.log(`--- would label: impact:${tier} ---`);
    console.log('--- would post this summary comment ---');
    console.log(summary);
    console.log('--- would leave these inline comments ---');
    console.log(
      comments.length === 0 ? '(none)' : comments.map((c) => `${c.path}:${c.line}  ${c.body.split('\n')[0]}`).join('\n')
    );
    console.log(`--- would resolve ${superseded.length} inline comment thread(s) from an earlier run ---`);
    return;
  }

  applyLabel({ repo, pr, tier });
  upsertSummary({ repo, pr, body: summary });

  if (superseded.length > 0) {
    resolveThreads({ ids: superseded });
  }

  if (comments.length === 0) {
    console.error('Nothing on the diff to point at.');
    return;
  }
  leaveReview({ repo, pr, headSha, tier, comments });
}

if (isMain(import.meta.url)) {
  const repo = env('GH_REPO');
  const pr = env('PR_NUMBER');

  post({
    repo,
    pr,
    headSha: env('HEAD_SHA'),
    claudeTier: env('TIER'),
    claudeBody: env('SUMMARY', '').trim().slice(0, 4000),
    spots: JSON.parse(env('SPOTS', '[]')),
    // Worked out again here rather than carried over from the judge. It is one
    // API call and it keeps the handoff to what only the judge could know.
    ...computeFloor({ repo, pr }),
    truncated: env('TRUNCATED', '').trim() === 'true',
    model: env('MODEL', ''),
    took: env('TOOK', ''),
    effort: env('EFFORT', ''),
    dryRun: Boolean(process.env.DRY_RUN),
  });
}
