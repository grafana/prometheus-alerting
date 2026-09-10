// Command oracle records how Go's own template parser reacts to every entry in
// testdata/corpus.txtar, and writes the answers to testdata/expected.json.
//
// That file is committed, so the TypeScript test suite can check our parser
// against real Go without anybody needing Go installed. You only need Go to
// regenerate it, which is `pnpm oracle:refresh` from the package root.
//
// Every template is parsed twice: once with text/template and once with
// html/template, because Alertmanager parses each notification template with
// both. Escaping happens when a template runs, not when it is parsed, so the
// two should always agree -- if they ever don't, this program fails rather than
// quietly picking one.
//
// Every template is also recorded a second time under "<name>#wrapped", after
// being put through the same {{ define }} wrapping the plugin applies on save.
// That is the string that actually reaches Mimir, so it is the string that
// actually has to validate.
package main

import (
	"encoding/json"
	"fmt"
	htmltemplate "html/template"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	texttemplate "text/template"
)

// goVersion and the func list below are recorded in the output so a reader can
// tell what produced it.
const outputVersion = 1

// goBuiltins are the functions text/template installs itself. Kept here rather
// than discovered by reflection because the parser only ever asks "is this name
// known", and this list is what makes that answer match Go's.
var goBuiltins = []string{
	"and", "call", "eq", "ge", "gt", "html", "index", "js", "le", "len",
	"lt", "ne", "not", "or", "print", "printf", "println", "slice", "urlquery",
}

// alertmanagerFuncs mirrors DefaultFuncs in prometheus/alertmanager's
// template package. Extracted from template/template.go rather than typed by
// hand; see VENDOR.md for the version this was taken from.
var alertmanagerFuncs = []string{
	"append", "base64decode", "base64encode", "date", "dict",
	"humanizeDuration", "join", "list", "match", "mustToDate", "now",
	"reReplaceAll", "routeLabels", "safeHtml", "safeUrl", "since",
	"stringSlice", "title", "toDate", "toJson", "toLower", "toUpper",
	"trimSpace", "tz", "urlUnescape",
}

// result is one entry's outcome. Err is Go's error string verbatim, empty when
// the template parsed.
type result struct {
	OK  bool   `json:"ok"`
	Err string `json:"err,omitempty"`
}

type output struct {
	Version   int               `json:"version"`
	GoVersion string            `json:"goVersion"`
	Funcs     []string          `json:"funcs"`
	Results   map[string]result `json:"results"`
}

func main() {
	root, err := findPackageRoot()
	if err != nil {
		fail(err)
	}

	corpusPath := filepath.Join(root, "testdata", "corpus.txtar")
	raw, err := os.ReadFile(corpusPath)
	if err != nil {
		fail(fmt.Errorf("read corpus: %w", err))
	}

	entries := parseTxtar(string(raw))
	if len(entries) == 0 {
		fail(fmt.Errorf("corpus %s has no entries", corpusPath))
	}

	funcNames := append(append([]string{}, goBuiltins...), alertmanagerFuncs...)
	sort.Strings(funcNames)

	results := make(map[string]result, len(entries)*2)
	for _, e := range entries {
		if _, seen := results[e.name]; seen {
			fail(fmt.Errorf("duplicate corpus entry name %q", e.name))
		}
		results[e.name] = parseBoth(e.name, e.body, funcNames)

		wrapped := ensureDefine("wrapped", e.body)
		results[e.name+"#wrapped"] = parseBoth(e.name+"#wrapped", wrapped, funcNames)
	}

	out := output{
		Version:   outputVersion,
		GoVersion: goVersionString(),
		Funcs:     funcNames,
		Results:   results,
	}

	encoded, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		fail(err)
	}
	encoded = append(encoded, '\n')

	expectedPath := filepath.Join(root, "testdata", "expected.json")
	if err := os.WriteFile(expectedPath, encoded, 0o644); err != nil {
		fail(fmt.Errorf("write expected.json: %w", err))
	}

	broken := 0
	for _, r := range results {
		if !r.OK {
			broken++
		}
	}
	fmt.Fprintf(os.Stderr, "%d entries (%d parse, %d fail) -> %s\n",
		len(results), len(results)-broken, broken, expectedPath)
}

// parseBoth parses with text/template and html/template and insists they
// agree. Alertmanager runs both over every template, so a disagreement would
// mean validating against the wrong one.
func parseBoth(name, src string, funcNames []string) result {
	textErr := parseText(name, src, funcNames)
	htmlErr := parseHTML(name, src, funcNames)

	if textErr != htmlErr {
		fail(fmt.Errorf("entry %q: text/template and html/template disagree\n  text: %s\n  html: %s",
			name, orNone(textErr), orNone(htmlErr)))
	}

	if textErr == "" {
		return result{OK: true}
	}
	return result{OK: false, Err: textErr}
}

func parseText(name, src string, funcNames []string) string {
	fm := texttemplate.FuncMap{}
	for _, n := range funcNames {
		fm[n] = stubFunc
	}
	if _, err := texttemplate.New(name).Funcs(fm).Parse(src); err != nil {
		return err.Error()
	}
	return ""
}

func parseHTML(name, src string, funcNames []string) string {
	fm := htmltemplate.FuncMap{}
	for _, n := range funcNames {
		fm[n] = stubFunc
	}
	if _, err := htmltemplate.New(name).Funcs(fm).Parse(src); err != nil {
		return err.Error()
	}
	return ""
}

// stubFunc stands in for every registered function. The parser only checks that
// a name is known; argument counts and types are an execution-time concern. It
// has to return exactly one value, or text/template refuses to install it.
func stubFunc(...any) string { return "" }

// definePattern and ensureDefine mirror ensureDefine in
// src/reducers/alertmanager/utils/templates.utils.ts. Kept in sync by the
// differential test, which feeds the TypeScript version's output through here.
var definePattern = regexp.MustCompile(`\{\{\s*define`)

func ensureDefine(name, content string) string {
	trimmed := strings.TrimSpace(content)
	if definePattern.MatchString(trimmed) {
		return trimmed
	}
	lines := strings.Split(trimmed, "\n")
	for i, line := range lines {
		lines[i] = "  " + line
	}
	return fmt.Sprintf("{{ define %q }}\n%s\n{{ end }}", name, strings.Join(lines, "\n"))
}

type entry struct {
	name string
	body string
}

// parseTxtar reads Go's txtar format: a line of the form "-- name --" starts a
// new entry and everything up to the next such line is its body. Anything
// before the first marker is a comment.
func parseTxtar(data string) []entry {
	var entries []entry
	var current *entry
	var body []string

	flush := func() {
		if current != nil {
			current.body = joinLines(body)
			entries = append(entries, *current)
		}
		body = nil
	}

	for _, line := range strings.Split(data, "\n") {
		if name, ok := txtarMarker(line); ok {
			flush()
			current = &entry{name: name}
			continue
		}
		if current != nil {
			body = append(body, line)
		}
	}
	flush()

	return entries
}

func txtarMarker(line string) (string, bool) {
	trimmed := strings.TrimSuffix(line, "\r")
	if !strings.HasPrefix(trimmed, "-- ") || !strings.HasSuffix(trimmed, " --") {
		return "", false
	}
	name := strings.TrimSpace(trimmed[3 : len(trimmed)-3])
	if name == "" {
		return "", false
	}
	return name, true
}

// joinLines rebuilds an entry body. txtar bodies are newline-terminated, and an
// entry with no content at all is the empty string rather than a lone newline.
func joinLines(lines []string) string {
	for len(lines) > 0 && lines[len(lines)-1] == "" {
		lines = lines[:len(lines)-1]
	}
	if len(lines) == 0 {
		return ""
	}
	return strings.Join(lines, "\n") + "\n"
}

// findPackageRoot walks up from the working directory looking for the directory
// holding testdata/corpus.txtar, so the program works from either the package
// root or oracle/.
func findPackageRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for i := 0; i < 5; i++ {
		if _, err := os.Stat(filepath.Join(dir, "testdata", "corpus.txtar")); err == nil {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	return "", fmt.Errorf("could not find testdata/corpus.txtar above the working directory")
}

func orNone(s string) string {
	if s == "" {
		return "(parsed cleanly)"
	}
	return s
}

func fail(err error) {
	fmt.Fprintf(os.Stderr, "oracle: %v\n", err)
	os.Exit(1)
}
