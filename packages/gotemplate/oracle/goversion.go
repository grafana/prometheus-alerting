package main

import (
	"runtime"
	"strings"
)

// goVersionString records which Go produced expected.json. The template parser
// is part of the standard library, so the toolchain version is the version of
// the thing we are matching ourselves against.
//
// Only the major and minor parts, deliberately. This value lands in a file we
// then assert is byte-identical, and CI installs whatever patch release is
// current for the pinned minor line -- so keeping the patch number here would
// fail the build every time Go shipped a patch, which says nothing about
// whether our parser still agrees with Go.
func goVersionString() string {
	version := runtime.Version()
	parts := strings.SplitN(strings.TrimPrefix(version, "go"), ".", 3)
	if len(parts) < 2 {
		return version
	}
	return "go" + parts[0] + "." + parts[1]
}
