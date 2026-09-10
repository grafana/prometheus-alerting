package main

import "runtime"

// goVersionString records which Go produced expected.json. The template parser
// is part of the standard library, so the toolchain version is the version of
// the thing we are matching ourselves against.
func goVersionString() string { return runtime.Version() }
