#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$ROOT_DIR/dist"
MANIFEST="$ROOT_DIR/manifest.json"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 is required to pack the extension." >&2
  exit 1
fi

VERSION="$(python3 - <<'PY'
import json, pathlib
manifest = json.loads(pathlib.Path("manifest.json").read_text())
print(manifest.get("version", "0.0.0"))
PY
)"

mkdir -p "$DIST_DIR"
ARCHIVE="$DIST_DIR/nogrok-${VERSION}.zip"

cd "$ROOT_DIR"
zip -r "$ARCHIVE" . \
  -x "dist/*" ".git/*" "pack.sh" "*.DS_Store" "*.log"

echo "Packed extension -> $ARCHIVE"
