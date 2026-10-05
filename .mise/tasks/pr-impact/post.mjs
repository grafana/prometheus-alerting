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
// read of the PR rather than an addition to earlier ones. That is why each run
// posts its rating and comments fresh and folds the earlier ones away — hiding
// the rating, resolving the threads — instead of working out which of the new
// points were already made. Matching new text against old text only ever half
// worked: Claude rewords, so a reworded repeat came out twice, and it sat there
// for good if the line under it never changed again.
//
// Set DRY_RUN=1 to print what would be posted instead of posting it.

import { gh, ghJson, ghPaginate, env, isMain, rank, TIERS } from './lib.mjs';
import { computeFloor } from './floor.mjs';

const SUMMARY_MARKER = '<!-- pr-impact -->';
const SPOT_MARKER = '<!-- pr-impact-spot -->';

// Said on every rating. A reader who scrolls past a stack of hidden ratings and
// resolved threads should know that is how this works, and not somebody tidying
// up after the bot.
const ROUND_NOTE =
  'Every run rates the whole PR again. Earlier ratings are hidden as outdated and their comments resolved, so what is left open is this round.';

// One four-step ramp, used the same way everywhere: the label colour, the emoji
// in the summary, and the prefix on each inline comment. The label names stay
// plain (`impact:medium`, no emoji) so a future merge gate can match on them.
const STYLE = {
  trivial: { emoji: '🟢', colour: '0E8A16', blurb: 'nothing that runs changes' },
  low: { emoji: '🟡', colour: 'FBCA04', blurb: 'you can see the change, but it works the same' },
  medium: { emoji: '🟠', colour: 'D4741F', blurb: 'something works differently now, in one part of the app' },
  high: { emoji: '🔴', colour: 'B60205', blurb: 'if this is wrong, someone loses something real' },
};

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

// Our own earlier ratings, so they can be folded away. The body is what
// identifies them as ours, and isMinimized says whether that has been done
// already — by an earlier run, or by hand.
const REVIEWS_QUERY = `
query($owner:String!, $name:String!, $pr:Int!, $cursor:String) {
  repository(owner:$owner, name:$name) {
    pullRequest(number:$pr) {
      reviews(first:100, after:$cursor) {
        pageInfo { hasNextPage endCursor }
        nodes { id isMinimized body author { __typename } }
      }
    }
  }
}`;

// OUTDATED rather than RESOLVED: the rating was not answered or dealt with, it
// was simply replaced by a newer one.
const MINIMIZE_MUTATION = `
mutation($subject:ID!) {
  minimizeComment(input:{subjectId:$subject, classifier:OUTDATED}) {
    minimizedComment { isMinimized }
  }
}`;

const RESOLVE_MUTATION = `
mutation($thread:ID!) {
  resolveReviewThread(input:{threadId:$thread}) { thread { id } }
}`;

/**
 * Every node of one paged connection on the PR — review threads or reviews.
 * `field` is the connection's name in the query, which is where the nodes are.
 */
function pagedNodes({ repo, pr, query, field }) {
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
      `query=${query}`,
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

    const page = ghJson(args).data.repository.pullRequest[field];
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
    // No ramp of all four tiers under this. The heading names the tier and the
    // blurb says what it means, which is what the ramp was there for — the rest
    // of it was teaching the scheme over and over to readers who know it.
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

/**
 * Put the rating in the body of a review, and keep editing that same review
 * rather than adding one per run.
 *
 * A review body cannot be taken back once submitted — it is not a thread, so it
 * cannot be resolved, and a submitted review cannot be deleted — but it can be
 * edited, which is all a sticky needs. What made this possible is the inline
 * comments going out on their own: a review that carries comments has to be a
 * new review each round, and each new review submits a body of its own.
 *
 * One thing a sticky cannot do is move. It is edited where it sits, so on a busy
 * PR the rating stays up in the conversation rather than following the newest
 * commit down. That was already true of the comment this replaces.
 */
/**
 * The ids of our own ratings that are still showing, which is what a new rating
 * replaces.
 *
 * Hidden rather than deleted, for the same reason the threads are resolved
 * rather than deleted: a hidden review folds out of the way but keeps what it
 * said, so this can be unconditional. One that is already hidden is left alone —
 * an earlier run did it, or somebody did it by hand, and either way there is
 * nothing left to do to it.
 */
export function ourShowingReviews(reviews, { onlyBot = Boolean(process.env.GITHUB_ACTIONS) } = {}) {
  return reviews
    .filter((review) => {
      if (review.isMinimized || !review.body?.includes(SUMMARY_MARKER)) {
        return false;
      }
      return !onlyBot || review.author?.__typename === 'Bot';
    })
    .map((review) => review.id);
}

/**
 * Fold away our earlier ratings, and the round of comments under them.
 *
 * Neither failing here fails the run: the rating is the point and it is already
 * posted by the time we get here. Both say how many of how many went through,
 * because saying only how many did is what hid the problem on PR 305 — every
 * resolve there was refused and the log said `Resolved 0`, which reads as
 * "there was nothing to resolve". gh prints its own reason on the way past.
 */
function minimizeReviews({ ids }) {
  let done = 0;

  for (const id of ids) {
    try {
      gh(['api', 'graphql', '-f', `query=${MINIMIZE_MUTATION}`, '-f', `subject=${id}`]);
      done++;
    } catch {
      // Gone, or we are not allowed to.
    }
  }

  console.error(`Hid ${done} of ${ids.length} earlier rating(s) as outdated.`);
}

function resolveThreads({ ids }) {
  let done = 0;

  for (const id of ids) {
    try {
      gh(['api', 'graphql', '-f', `query=${RESOLVE_MUTATION}`, '-f', `thread=${id}`]);
      done++;
    } catch {
      // Gone, or we are not allowed to.
    }
  }

  console.error(`Resolved ${done} of ${ids.length} inline comment thread(s) from an earlier run.`);
}

/**
 * Post the rating and this round's inline comments as one review.
 *
 * One review, not a comment plus a review per spot: the whole round arrives
 * together or not at all. GitHub rejects the review whole if any one of its
 * comments misses a changed line, which is the behaviour worth having — a round
 * that is half posted would leave the rating counting places that are not
 * marked. pickComments has already dropped the ones that cannot land.
 *
 * The rating goes in the review's own body. A review body cannot be empty, and
 * that used to mean a second `Rated ...` line stacking up on every run; now the
 * body is the rating itself, and the earlier ones get hidden rather than
 * repeated.
 */
function leaveReview({ repo, pr, headSha, body, comments }) {
  const review = { commit_id: headSha, event: 'COMMENT', body, comments };

  gh(['api', '-X', 'POST', `repos/${repo}/pulls/${pr}/reviews`, '--input', '-'], JSON.stringify(review));
  console.error(`Posted the rating with ${comments.length} inline comment(s).`);
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
  // Both read before anything is posted, so this round is never in the list of
  // what gets folded away.
  const superseded = ourOpenThreads(pagedNodes({ repo, pr, query: THREADS_QUERY, field: 'reviewThreads' }));
  const stale = ourShowingReviews(pagedNodes({ repo, pr, query: REVIEWS_QUERY, field: 'reviews' }));
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
    console.log('--- would post this as the review body ---');
    console.log(summary);
    console.log('--- with these inline comments in the same review ---');
    console.log(
      comments.length === 0 ? '(none)' : comments.map((c) => `${c.path}:${c.line}  ${c.body.split('\n')[0]}`).join('\n')
    );
    console.log(`--- would then hide ${stale.length} earlier rating(s) and resolve ${superseded.length} thread(s) ---`);
    return;
  }

  applyLabel({ repo, pr, tier });

  // The new rating goes up before any of the old is folded away. If posting it
  // throws — a comment on a line GitHub disagrees about, and the whole review is
  // refused — the PR is left showing the previous rating rather than none.
  leaveReview({ repo, pr, headSha, body: summary, comments });

  if (stale.length > 0) {
    minimizeReviews({ ids: stale });
  }
  if (superseded.length > 0) {
    resolveThreads({ ids: superseded });
  }
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
