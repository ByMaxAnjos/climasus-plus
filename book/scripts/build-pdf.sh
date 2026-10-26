#!/usr/bin/env bash
# Gera o PDF desenhado do guia: capa + corpo, A4, sem margens de impressão.
set -euo pipefail

cd "$(dirname "$0")/.."

python3 scripts/build-print.py

cd _book

PORT=8769
python3 -m http.server "$PORT" >/tmp/climasus-guia-http.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

sleep 1

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [[ ! -x "$CHROME" ]]; then
  echo "Chrome não encontrado em: $CHROME" >&2
  echo "Ajuste CHROME no script ou use Edge/Chromium com --headless." >&2
  exit 1
fi

"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf=cover.pdf "http://localhost:${PORT}/print-cover.html" >/dev/null 2>&1
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf=body.pdf "http://localhost:${PORT}/print-body.html" >/dev/null 2>&1

if command -v pdfunite >/dev/null 2>&1; then
  pdfunite cover.pdf body.pdf climasus-studio-guia-pratico.pdf
else
  python3 - <<'PY'
from pypdf import PdfWriter
writer = PdfWriter()
for name in ("cover.pdf", "body.pdf"):
    writer.append(name)
with open("climasus-studio-guia-pratico.pdf", "wb") as fh:
    writer.write(fh)
PY
fi

echo "PDF gerado: _book/climasus-studio-guia-pratico.pdf"
pdfinfo climasus-studio-guia-pratico.pdf 2>/dev/null | grep -E "Pages|Page size" || true
