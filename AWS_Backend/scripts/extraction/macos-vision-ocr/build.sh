#!/usr/bin/env bash
# Build the MacOSVisionOCR CLI binary.
# Output: ./bin/MacOSVisionOCR (an arm64 / x86_64 universal binary if both are
# requested; default is just the host arch which is what we want for personal use).

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/MacOSVisionOCR.swift"
OUT_DIR="$HERE/bin"
OUT_BIN="$OUT_DIR/MacOSVisionOCR"

mkdir -p "$OUT_DIR"

# Vision + PDFKit + AppKit are all in the macOS SDK; swiftc finds them by
# default. Optimization on for sane runtime perf.
swiftc \
  -O \
  -o "$OUT_BIN" \
  "$SRC"

echo "Built: $OUT_BIN"
"$OUT_BIN" --help 2>&1 | head -3 || true
