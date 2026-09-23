// Unit tests for the parts of post.mjs that decide what to say and what to put
// away. Run them with `mise run pr-impact:check`.
//
// Not executable, so mise doesn't offer it as a task of its own.
//
// Nothing here touches the network: every test hands the functions the shape
// the GitHub API returns and checks what comes back.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { pickComments, ourOpenThreads, ourShowingReviews } from './post.mjs';

/** A review thread as the GraphQL query returns it, with only what we read. */
function thread({ id = 'PRRT_1', resolved = false, body = '<!-- pr-impact-spot -->', author = 'Bot', replies = 0 }) {
  return {
    id,
    isResolved: resolved,
    comments: { totalCount: 1 + replies, nodes: [{ body, author: { __typename: author } }] },
  };
}

/** A review as the GraphQL query returns it, with only what we read. */
function review({ id = 'PRR_1', minimized = false, body = '<!-- pr-impact -->', author = 'Bot' }) {
  return { id, isMinimized: minimized, body, author: { __typename: author } };
}

/** A patch that adds the given line numbers, one hunk per line. */
function patchAdding(lines) {
  return lines.map((line) => `@@ -${line},0 +${line},1 @@\n+touched`).join('\n');
}

function filesAdding(path, lines) {
  return [{ filename: path, patch: patchAdding(lines) }];
}

test('a spot on an added line becomes a comment carrying the marker', () => {
  const [posted] = pickComments({
    spots: [{ tier: 'high', path: 'a.ts', line: 10, why: 'a reason' }],
    files: filesAdding('a.ts', [10]),
  });
  assert.equal(posted.line, 10);
  assert.equal(posted.side, 'RIGHT');
  assert.match(posted.body, /🔴 \*\*impact: high\*\* — a reason/);
  assert.match(posted.body, /<!-- pr-impact-spot -->/);
});

test('a spot on a line the diff does not add is dropped', () => {
  const comments = pickComments({
    spots: [{ tier: 'high', path: 'a.ts', line: 7, why: 'a reason' }],
    files: filesAdding('a.ts', [10]),
  });
  assert.deepEqual(comments, []);
});

test('two different points on one line both land', () => {
  // What went wrong on PR 285: one comment per line meant a later run's second,
  // different risk on InhibitRuleFormModel.ts:39 was thrown away because the
  // line was taken. Nothing is keyed on the line any more.
  const comments = pickComments({
    spots: [
      { tier: 'high', path: 'form.ts', line: 39, why: 'this builds the matcher strings' },
      { tier: 'medium', path: 'form.ts', line: 39, why: 'every row is re-encoded on save' },
    ],
    files: filesAdding('form.ts', [39]),
  });
  assert.equal(comments.length, 2);
  assert.match(comments[1].body, /re-encoded on save/);
});

test('the very same point twice in one answer is said once', () => {
  const why = 'the quoting here decides what gets suppressed';
  const comments = pickComments({
    spots: [
      { tier: 'high', path: 'a.ts', line: 10, why },
      { tier: 'high', path: 'a.ts', line: 20, why },
    ],
    files: filesAdding('a.ts', [10, 20]),
  });
  assert.equal(comments.length, 1);
  assert.equal(comments[0].line, 10);
});

test('the same point on two different files is said on both', () => {
  const why = 'same risk, two places';
  const comments = pickComments({
    spots: [
      { tier: 'high', path: 'a.ts', line: 10, why },
      { tier: 'high', path: 'b.ts', line: 10, why },
    ],
    files: [...filesAdding('a.ts', [10]), ...filesAdding('b.ts', [10])],
  });
  assert.deepEqual(
    comments.map((c) => c.path),
    ['a.ts', 'b.ts']
  );
});

test('a reworded repeat is posted, because the old round is put away instead', () => {
  // The case the hash could never get right: same point, different words. It
  // gets posted, and the previous round's copy is resolved in the same run.
  const first = pickComments({
    spots: [{ tier: 'high', path: 'a.ts', line: 10, why: 'this builds the string sent to Alertmanager' }],
    files: filesAdding('a.ts', [10]),
  });
  const second = pickComments({
    spots: [{ tier: 'high', path: 'a.ts', line: 10, why: 'this constructs the string sent to Alertmanager' }],
    files: filesAdding('a.ts', [10]),
  });
  assert.equal(second.length, 1);
  assert.deepEqual(ourOpenThreads([thread({ body: first[0].body })], { onlyBot: true }), ['PRRT_1']);
});

test('our open threads are the ones to resolve', () => {
  const threads = [thread({ id: 'PRRT_1' }), thread({ id: 'PRRT_2' })];
  assert.deepEqual(ourOpenThreads(threads, { onlyBot: true }), ['PRRT_1', 'PRRT_2']);
});

test('an already-resolved thread is left alone', () => {
  assert.deepEqual(ourOpenThreads([thread({ resolved: true })], { onlyBot: true }), []);
});

test("somebody else's thread is left alone", () => {
  const threads = [thread({ body: 'looks fine to me' }), thread({ id: 'PRRT_9', body: 'why did the bot say that?' })];
  assert.deepEqual(ourOpenThreads(threads, { onlyBot: true }), []);
});

test('a person quoting the marker cannot get their thread resolved', () => {
  // Anyone who can push can write the marker. In Actions the bot is the poster,
  // so a human-authored thread is not ours however it is worded.
  const threads = [thread({ author: 'User' })];
  assert.deepEqual(ourOpenThreads(threads, { onlyBot: true }), []);
  // Run by hand, the poster is a person, so that check is off.
  assert.deepEqual(ourOpenThreads(threads, { onlyBot: false }), ['PRRT_1']);
});

test('a thread with no comments left in it is skipped', () => {
  assert.deepEqual(ourOpenThreads([{ id: 'PRRT_1', isResolved: false, comments: { nodes: [] } }]), []);
});

test('a thread somebody replied to is left open', () => {
  // Deleting the comment would have taken the reply with it, which is why the
  // old code needed a special case for this. Resolving wouldn't lose anything,
  // but it would fold up a conversation somebody is still having.
  assert.deepEqual(ourOpenThreads([thread({ replies: 1 })], { onlyBot: true }), []);
});

test('our ratings that are still showing are the ones to hide', () => {
  const reviews = [review({ id: 'PRR_1' }), review({ id: 'PRR_2' })];
  assert.deepEqual(ourShowingReviews(reviews, { onlyBot: true }), ['PRR_1', 'PRR_2']);
});

test('a rating already hidden is left alone', () => {
  // An earlier run did it, or somebody did it by hand. Either way, nothing left.
  assert.deepEqual(ourShowingReviews([review({ minimized: true })], { onlyBot: true }), []);
});

test("somebody else's review is left alone, marker or not", () => {
  const reviews = [review({ body: 'looks fine to me' }), review({ id: 'PRR_9', author: 'User' })];
  assert.deepEqual(ourShowingReviews(reviews, { onlyBot: true }), []);
  // Run by hand the poster is a person, so only the marker decides.
  assert.deepEqual(ourShowingReviews(reviews, { onlyBot: false }), ['PRR_9']);
});
