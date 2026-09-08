#!/usr/bin/env node
//MISE description="Work out the lowest impact rating a PR is allowed, from its file list alone"

// Cheap, deterministic rules that run before Claude sees anything. They set a
// floor under the rating that Claude can raise but never lower, so no judgement
// call can pull a change touching sensitive paths down into the tiers we might
// one day auto-approve.

import { ghJson, setOutput, env, isMain } from './lib.mjs';

// Past these, a change stops being something a reviewer can eyeball, whatever
// it touches.
const MAX_FILES = Number(process.env.MAX_FILES ?? 15);
const MAX_LINES = Number(process.env.MAX_LINES ?? 300);

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

// Prose a reviewer reads rather than checks. An architecture decision record
// runs to hundreds of lines and is still one idea, so its length shouldn't be
// what pushes a PR out of the band we might fast-track.
//
// docs/sources is deliberately not on this list: it ships to users, so a large
// change to it is a large review, the same as code.
const SIZE_EXEMPT = [/^docs\/adr\//];

function floorFor(files) {
  const denied = files
    .map((file) => file.path)
    .filter((path) => NEVER_FAST_TRACK.some((pattern) => pattern.test(path)));

  // The size limits are about how much there is to review, so measure them over
  // the files that need reviewing.
  const counted = files.filter((file) => !SIZE_EXEMPT.some((pattern) => pattern.test(file.path)));
  const changed = counted.reduce((total, file) => total + file.additions + file.deletions, 0);
  const skipped = files.length - counted.length;
  const aside = skipped > 0 ? `, not counting ${skipped} ADR file${skipped === 1 ? '' : 's'}` : '';

  if (denied.length > 0) {
    return { floor: 'high', reason: `touches paths that are never fast-tracked: ${denied.join(', ')}` };
  }
  if (counted.length > MAX_FILES) {
    return {
      floor: 'medium',
      reason: `touches ${counted.length} files (over the ${MAX_FILES} that still reads as a small change)${aside}`,
    };
  }
  if (changed > MAX_LINES) {
    return {
      floor: 'medium',
      reason: `changes ${changed} lines (over the ${MAX_LINES} that still reads as a small change)${aside}`,
    };
  }
  return { floor: 'trivial', reason: '' };
}

export function computeFloor({ repo, pr }) {
  const files = ghJson(['pr', 'view', String(pr), '--repo', repo, '--json', 'files', '--jq', '.files']);
  return floorFor(files);
}

if (isMain(import.meta.url)) {
  const result = computeFloor({ repo: env('GH_REPO'), pr: env('PR_NUMBER') });
  console.error(`Floor: ${result.floor}${result.reason ? ` (${result.reason})` : ''}`);
  setOutput(result);
}
