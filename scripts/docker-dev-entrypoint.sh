#!/bin/sh
set -e

cd /app

if [ ! -d node_modules/.pnpm ] || [ ! -f node_modules/.modules.yaml ]; then
  echo "Installing dependencies..."
  pnpm install --frozen-lockfile
fi

exec "$@"
