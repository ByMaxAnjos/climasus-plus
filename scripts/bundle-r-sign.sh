#!/bin/bash
# Strips debug/doc cruft and ad-hoc codesigns every Mach-O binary in the bundled R runtime.
# Run after scripts/bundle-r.R. Ad-hoc signing (-s -) lets the app run locally; it still
# triggers a Gatekeeper warning on other Macs until properly notarized (see README).
set -euo pipefail
cd "$(dirname "$0")/.."
R_DIR="src-tauri/resources/r"
LIB="$R_DIR/library"

[ -d "$LIB" ] || { echo "run scripts/bundle-r.R first"; exit 1; }

echo "before: $(du -sh "$R_DIR" | cut -f1)"

echo "stripping debug symbols and docs…"
find "$LIB" -name "*.dSYM" -print0 | xargs -0 rm -rf
find "$LIB" -depth -type d \( -name "doc" -o -name "tests" -o -name "R-ex" -o -name "html" \) -print0 | xargs -0 rm -rf
# keep help/AnIndex + help/aliases.rds (needed by ? and some packages at load time), drop rendered help pages
find "$LIB" -depth -type d -name "help" -print0 | while IFS= read -r -d '' d; do
  find "$d" -type f ! -name "AnIndex" ! -name "aliases.rds" ! -name "paths.rds" -delete
done
find "$LIB" -name "*.pdf" -delete
find "$LIB" -name "NEWS.Rd" -delete

echo "after strip: $(du -sh "$R_DIR" | cut -f1)"

echo "ad-hoc codesigning Mach-O binaries…"
count=0
while IFS= read -r -d '' f; do
  if file "$f" 2>/dev/null | grep -q "Mach-O"; then
    codesign --force --sign - --timestamp=none "$f" 2>/dev/null && count=$((count + 1))
  fi
done < <(find "$R_DIR" -type f \( -name "*.so" -o -name "*.dylib" -o -perm -u+x \) -print0)
echo "codesigned $count binaries"

echo "done: $(du -sh "$R_DIR" | cut -f1)"
