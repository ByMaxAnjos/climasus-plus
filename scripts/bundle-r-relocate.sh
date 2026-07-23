#!/bin/bash
# CRAN's R.framework hardcodes absolute dylib paths (/Library/Frameworks/R.framework/...)
# in every compiled binary — copying files alone still loads the SYSTEM libR.dylib, which
# defeats the whole point of bundling. This rewrites every reference to @rpath and adds a
# correct @loader_path-relative RPATH to each file, so the bundle is truly self-contained.
# Run BEFORE scripts/bundle-r-sign.sh (that script's codesign pass must be the last step,
# since install_name_tool invalidates any existing signature). Bash 3.2 compatible (macOS default).
set -euo pipefail
cd "$(dirname "$0")/.."
BUNDLE="$(pwd)/src-tauri/resources/r"
LIBDIR="$BUNDLE/lib"

[ -d "$LIBDIR" ] || { echo "run scripts/bundle-r.R first"; exit 1; }

relpath() { perl -MFile::Spec -e 'print File::Spec->abs2rel($ARGV[0], $ARGV[1])' "$1" "$2"; }

# bin/R hardcodes R_HOME_DIR (and the share/include/doc dirs derived from it) as an absolute
# path at configure time — make it self-detect from its own location instead. bin/Rscript is
# a compiled binary with its own independent hardcoded default used to locate bin/R, which it
# does NOT self-detect (verified empirically) — so the bundled engine must be launched via
# `bin/R --no-echo --no-restore --file=... --args ...`, never via bin/Rscript.
echo "patching bin/R to self-detect R_HOME…"
perl -0pi -e '
  s{^R_HOME_DIR=/.*$}{R_HOME_DIR=\$(cd "\$(dirname "\$0")/.." && pwd)}m;
  s{^R_SHARE_DIR=/.*$}{R_SHARE_DIR="\${R_HOME_DIR}/share"}m;
  s{^R_INCLUDE_DIR=/.*$}{R_INCLUDE_DIR="\${R_HOME_DIR}/include"}m;
  s{^R_DOC_DIR=/.*$}{R_DOC_DIR="\${R_HOME_DIR}/doc"}m;
' "$BUNDLE/bin/R"

# the absolute install-name -> local basename map, for every core R shared lib
OLD_PATHS=()
NEW_NAMES=()
while IFS= read -r name; do
  old=$(otool -D "$LIBDIR/$name" 2>/dev/null | tail -1)
  [ -n "$old" ] || continue
  OLD_PATHS+=("$old")
  NEW_NAMES+=("$name")
done < <(find "$LIBDIR" -maxdepth 1 -name "*.dylib" -exec basename {} \;)

lookup_name() {
  local target="$1" i
  for i in "${!OLD_PATHS[@]}"; do
    [ "${OLD_PATHS[$i]}" = "$target" ] && { echo "${NEW_NAMES[$i]}"; return 0; }
  done
  return 1
}

echo "retargeting IDs of ${#NEW_NAMES[@]} core libs to @rpath…"
for name in "${NEW_NAMES[@]}"; do
  install_name_tool -id "@rpath/$name" "$LIBDIR/$name" 2>/dev/null || true
done

echo "patching load-path references + adding rpaths across the bundle…"
patched=0
while IFS= read -r -d '' f; do
  file "$f" 2>/dev/null | grep -q "Mach-O" || continue
  needs_rpath=false
  while IFS= read -r line; do
    old=$(echo "$line" | awk '{print $1}')
    name=$(lookup_name "$old" || true)
    if [ -n "$name" ]; then
      install_name_tool -change "$old" "@rpath/$name" "$f" 2>/dev/null || true
      needs_rpath=true
    fi
  done < <(otool -L "$f" 2>/dev/null | tail -n +2)

  if $needs_rpath; then
    rel=$(relpath "$LIBDIR" "$(dirname "$f")")
    rpath="@loader_path/$rel"
    if ! otool -l "$f" 2>/dev/null | grep -A2 LC_RPATH | grep -q "$rpath"; then
      install_name_tool -add_rpath "$rpath" "$f" 2>/dev/null || true
    fi
    patched=$((patched + 1))
  fi
done < <(find "$BUNDLE" -type f \( -name "*.so" -o -name "*.dylib" -o -perm -u+x \) -print0)

echo "patched $patched binaries. Now run: bash scripts/bundle-r-sign.sh (re-signs everything)."
