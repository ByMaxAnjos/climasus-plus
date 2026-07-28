#!/bin/bash
# Debian/Ubuntu's R build hardcodes an absolute R_HOME_DIR (and the share/include/doc dirs
# derived from it) in bin/R at configure time — same issue scripts/bundle-r-relocate.sh fixes
# on macOS. This patches bin/R to self-detect R_HOME from its own location instead.
#
# Unlike macOS, shared libs are NOT patched here: rather than rewriting ELF RPATHs with
# patchelf, src-tauri/src/lib.rs sets LD_LIBRARY_PATH to the bundled r/lib dir before spawning
# R, which is enough for the dynamic linker to find the bundled libR.so instead of the system one.
set -euo pipefail
cd "$(dirname "$0")/.."
BUNDLE="$(pwd)/src-tauri/resources/r"

[ -f "$BUNDLE/bin/R" ] || { echo "run scripts/bundle-r-linux.R first"; exit 1; }

echo "patching bin/R to self-detect R_HOME…"
perl -0pi -e '
  s{^R_HOME_DIR=/.*$}{R_HOME_DIR=\$(cd "\$(dirname "\$0")/.." && pwd)}m;
  s{^R_SHARE_DIR=/.*$}{R_SHARE_DIR="\${R_HOME_DIR}/share"}m;
  s{^R_INCLUDE_DIR=/.*$}{R_INCLUDE_DIR="\${R_HOME_DIR}/include"}m;
  s{^R_DOC_DIR=/.*$}{R_DOC_DIR="\${R_HOME_DIR}/doc"}m;
' "$BUNDLE/bin/R"

echo "done."
