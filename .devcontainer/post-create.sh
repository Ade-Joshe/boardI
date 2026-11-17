#!/usr/bin/env bash
set -euo pipefail

if [ ! -w node_modules ]; then
  echo "node_modules volume is not writable by $(id -un)." >&2
  echo "Remove the volume and rebuild: docker volume ls | grep boardi-node_modules" >&2
  exit 1
fi

if [ -f pnpm-lock.yaml ]; then
  pnpm install --frozen-lockfile
else
  pnpm install
fi
