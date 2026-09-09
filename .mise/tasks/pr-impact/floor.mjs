#!/usr/bin/env node
//MISE description="Work out the lowest impact rating a PR is allowed, from its file list alone"

// A cheap, deterministic check that runs before Claude sees anything. It sets a
// floor under the rating that Claude can raise but never lower, so no judgement
// call can pull a change touching sensitive paths down into the tiers we might
// one day auto-approve.
//
// Size is deliberately not part of this. A big PR can still be low impact if it
// doesn't change how anything behaves — a rename across fifty files, say — and a
// one-line PR can be the dangerous one. Claude judges that from the diff; a line
// count can't.

import { ghPaginate, setOutput, env, isMain } from './lib.mjs';

// Paths where a small diff can still have a large blast radius: CI and release
// plumbing (also the route someone would take to weaken this workflow), the
// plugin's declared permissions and metadata, and the access control layer.
const NEVER_FAST_TRACK = [
  /^\.github\//,
  /^scripts\//,
  /^provisioning\//,
  /^webpack\.config\.ts$/,
  /^docker-compose\.yaml$/,
  /^mise/,
  // The rating machinery itself, and the build config the plugin scaffold owns.
  // A change to either is exactly the kind of thing that should get read.
  /^\.mise\//,
  /^\.config\//,
  /^release-please/,
  /^\.release-please/,
  /^src\/plugin\.json$/,
  /^src\/access-control\//,
  /^SECURITY/,
];

function floorFor(paths) {
  const denied = paths.filter((path) => NEVER_FAST_TRACK.some((pattern) => pattern.test(path)));

  return denied.length > 0
    ? { floor: 'high', reason: `touches paths that are never fast-tracked: ${denied.join(', ')}` }
    : { floor: 'trivial', reason: '' };
}

export function computeFloor({ repo, pr }) {
  // The REST endpoint, paginated, rather than `gh pr view --json files`: that
  // one stops at 100 files, and a denied path sitting past the cap would go
  // unseen — letting a wide PR through that should have been held.
  const paths = ghPaginate(`repos/${repo}/pulls/${pr}/files`).map((file) => file.filename);
  return floorFor(paths);
}

if (isMain(import.meta.url)) {
  const result = computeFloor({ repo: env('GH_REPO'), pr: env('PR_NUMBER') });
  console.error(`Floor: ${result.floor}${result.reason ? ` (${result.reason})` : ''}`);
  setOutput(result);
}
