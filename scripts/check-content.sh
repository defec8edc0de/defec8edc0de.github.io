#!/usr/bin/env bash
# Fails if invisible / bidi-control Unicode appears in site sources (prompt-injection and "trojan source" hygiene).
# Phase D canaries are stored as ASCII escapes (data/tagmap.json), so they never trip this check.
set -euo pipefail
cd "$(dirname "$0")/.."
# Unicode tag characters (U+E0000..U+E007F), zero-width (U+200B..U+200D, U+2060, U+FEFF), bidi (U+202A..U+202E, U+2066..U+2069)
pattern='[\x{E0000}-\x{E007F}\x{200B}-\x{200D}\x{2060}\x{FEFF}\x{202A}-\x{202E}\x{2066}-\x{2069}]'
paths=(content data i18n layouts assets/css assets/js hugo.toml)
if hits=$(grep -rnP --binary-files=without-match "$pattern" "${paths[@]}" 2>/dev/null); then
  echo "check-content: invisible or bidi-control Unicode found:" >&2
  echo "$hits" | cut -c1-160 | sed 's/^/  /' >&2
  exit 1
fi
echo "check-content: OK (no invisible/bidi Unicode in ${paths[*]})"
