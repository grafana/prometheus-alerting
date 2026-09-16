/**
 * The function names a notification template is allowed to call.
 *
 * Go's parser rejects a template that calls a name it doesn't know, so this
 * list is what an "unknown function" check would compare against. Nothing
 * checks it yet -- see the note at the bottom about why that check has to be a
 * warning rather than an error when it lands.
 *
 * The oracle records the list it used in testdata/expected.json, and
 * funcs.test.ts asserts the two agree, so this can't quietly drift away from
 * what we validate against.
 */

/** Functions text/template installs by itself. */
const GO_BUILTIN_FUNCS = [
  'and',
  'call',
  'eq',
  'ge',
  'gt',
  'html',
  'index',
  'js',
  'le',
  'len',
  'lt',
  'ne',
  'not',
  'or',
  'print',
  'printf',
  'println',
  'slice',
  'urlquery',
] as const;

/**
 * DefaultFuncs from prometheus/alertmanager's template package, taken from
 * template/template.go. See VENDOR.md for the version.
 */
const ALERTMANAGER_FUNCS = [
  'append',
  'base64decode',
  'base64encode',
  'date',
  'dict',
  'humanizeDuration',
  'join',
  'list',
  'match',
  'mustToDate',
  'now',
  'reReplaceAll',
  'routeLabels',
  'safeHtml',
  'safeUrl',
  'since',
  'stringSlice',
  'title',
  'toDate',
  'toJson',
  'toLower',
  'toUpper',
  'trimSpace',
  'tz',
  'urlUnescape',
] as const;

/**
 * Every name a Mimir notification template can call.
 *
 * Careful with this: which functions exist depends on the Alertmanager version
 * Mimir was built against, so a Mimir newer than this list would accept
 * templates we'd think were broken. Blocking a save on this list would then
 * stop somebody using a function that genuinely works. Report unknown names as
 * a warning, not an error.
 */
export const KNOWN_TEMPLATE_FUNCS: ReadonlySet<string> = new Set<string>([...GO_BUILTIN_FUNCS, ...ALERTMANAGER_FUNCS]);
