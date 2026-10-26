#!/usr/bin/env bash
# Atalho: HTML -> PDF -> DOCX.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== HTML =="
quarto render --to html

echo "== PDF =="
bash scripts/build-pdf.sh

echo "== DOCX =="
python3 scripts/build-docx.py

echo
echo "Pronto:"
echo "  _book/index.html"
echo "  _book/climasus-studio-guia-pratico.pdf"
echo "  _book/climasus-studio-guia-pratico.docx"
