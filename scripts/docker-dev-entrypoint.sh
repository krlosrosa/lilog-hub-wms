#!/bin/sh
set -e

cd /app

if [ ! -f package.json ]; then
  echo "ERROR: package.json not found in /app."
  echo ""
  echo "If you are on Portainer, do NOT use docker-compose.dev.yml."
  echo "Use docker-compose.yml (production) instead."
  echo ""
  echo "For local hot-reload, run:"
  echo "  docker compose -f docker-compose.dev.yml -f docker-compose.dev.local.yml up --build"
  exit 1
fi

if [ ! -d node_modules/.pnpm ] || [ ! -f node_modules/.modules.yaml ]; then
  echo "Installing dependencies..."
  pnpm install --frozen-lockfile --ignore-scripts
  pnpm --filter @lilog/contracts build
fi

exec "$@"
