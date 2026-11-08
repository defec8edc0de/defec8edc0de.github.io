#!/usr/bin/env bash
# Full site build, used by the GitHub Actions workflow AND locally:  HUGO=/path/to/hugo scripts/build.sh
#  1. content hygiene check   2. hugo build   3. copy the encrypted vault (vault/) through untouched   4. verify it byte-for-byte
set -euo pipefail
cd "$(dirname "$0")/.."
HUGO="${HUGO:-hugo}"

scripts/check-content.sh

rm -rf public
"$HUGO" --gc --minify --panicOnWarning --printI18nWarnings --printPathWarnings

# --- vault passthrough (vault/tw.html, vault/m/, vault/<12hex>/) — never touched by Hugo, copied verbatim ----------
[ -f vault/tw.html ] || { echo "build: vault/tw.html missing" >&2; exit 1; }
[ -e public/vault ] && { echo "build: public/vault already exists (a Hugo page must not use /vault/)" >&2; exit 1; }
cp -rp vault public/vault

# --- verify ----------------------------------------------------------------------------------------------------
list() { (cd "$1" && find . -type f \( -name tw.html -o -regex '\./m/[0-9a-f]*\.bin' -o -regex '\./[0-9a-f]\{12\}/[0-9a-f]\{32\}\.bin' \) -exec sha256sum {} + | sort -k2); }
src=$(list vault); dst=$(list public/vault)
if [ "$src" != "$dst" ]; then echo "build: vault passthrough mismatch" >&2; diff <(echo "$src") <(echo "$dst") | head >&2; exit 1; fi
ls public/vault/m/*.bin >/dev/null 2>&1 || { echo "build: vault manifest missing in public/vault/m/" >&2; exit 1; }
echo "build: OK — vault passthrough verified ($(echo "$src" | wc -l) files byte-identical)"
