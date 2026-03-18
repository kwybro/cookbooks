#!/usr/bin/env bash
# Copies drizzle-kit generated SQL migrations into the iOS project so Xcode
# picks them up as bundle resources. Run this after `bun run generate`, or
# use `bun run sync` to do both in one step.
#
# CI usage: add `bun run sync` in packages/data-ops as a pre-build step
# before the Xcode archive action.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$SCRIPT_DIR/../migrations"
DEST="$SCRIPT_DIR/../../../apps/ios/Slowcook/Migrations"

mkdir -p "$DEST"

SQL_FILES=("$SRC"/*.sql)
if [ ! -e "${SQL_FILES[0]}" ]; then
  echo "No migration files found in $SRC — run 'bun run generate' first."
  exit 1
fi

cp "$SRC"/*.sql "$DEST/"

COUNT=$(ls "$SRC"/*.sql | wc -l | tr -d ' ')
echo "✓ Synced $COUNT migration(s) → apps/ios/Slowcook/Migrations/"
