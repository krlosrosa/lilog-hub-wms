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

# Fallbacks quando o Portainer não expande ${VAR:-default} do compose
export DATABASE_URL="${DATABASE_URL:-postgres://user:pass@host.docker.internal:5432/lilog}"
export JWT_SECRET="${JWT_SECRET:-supersecret}"
export PORT="${PORT:-3001}"
export NODE_ENV="${NODE_ENV:-development}"
export API_PUBLIC_URL="${API_PUBLIC_URL:-http://localhost:3001}"
export SWAGGER_PUBLIC_URL="${SWAGGER_PUBLIC_URL:-${API_PUBLIC_URL}/api/docs}"
export BULL_BOARD_PUBLIC_URL="${BULL_BOARD_PUBLIC_URL:-${API_PUBLIC_URL}/queues}"
export PWA_BASE_URL="${PWA_BASE_URL:-http://localhost:5174}"
export CORS_ORIGIN="${CORS_ORIGIN:-http://localhost:3000,http://localhost:3002,http://localhost:5174,http://localhost:5175}"
export REDIS_HOST="${REDIS_HOST:-redis}"
export REDIS_PORT="${REDIS_PORT:-6379}"
export PUPPETEER_SKIP_DOWNLOAD="${PUPPETEER_SKIP_DOWNLOAD:-true}"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:3001/api}"

# NestJS (ConfigModule) lê .env em apps/api — sincroniza env do container
mkdir -p apps/api
cat > apps/api/.env <<EOF
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
PORT=${PORT}
NODE_ENV=${NODE_ENV}
CORS_ORIGIN=${CORS_ORIGIN}
API_PUBLIC_URL=${API_PUBLIC_URL}
SWAGGER_PUBLIC_URL=${SWAGGER_PUBLIC_URL}
BULL_BOARD_PUBLIC_URL=${BULL_BOARD_PUBLIC_URL}
PWA_BASE_URL=${PWA_BASE_URL}
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=${REDIS_PORT}
REDIS_PASSWORD=${REDIS_PASSWORD:-}
REDIS_USERNAME=${REDIS_USERNAME:-}
RAVEX_BASE_URL=${RAVEX_BASE_URL:-}
RAVEX_USERNAME=${RAVEX_USERNAME:-}
RAVEX_PASSWORD=${RAVEX_PASSWORD:-}
R2_ACCOUNT_ID=${R2_ACCOUNT_ID:-}
R2_API_TOKEN=${R2_API_TOKEN:-}
R2_BUCKET_NAME=${R2_BUCKET_NAME:-}
R2_PUBLIC_URL=${R2_PUBLIC_URL:-}
PUPPETEER_SKIP_DOWNLOAD=${PUPPETEER_SKIP_DOWNLOAD}
EOF

echo "Lilog Hub — URLs públicas:"
echo "  API:         ${API_PUBLIC_URL}/api"
echo "  Swagger:     ${SWAGGER_PUBLIC_URL}"
echo "  Bull Board:  ${BULL_BOARD_PUBLIC_URL}"
echo "  Web:         https://${WEB_HOST:-admin-dev.logistica-processo.com}"
echo "  PWA:         https://${PWA_HOST:-pwa-dev.logistica-processo.com}"
echo "  Liderança:   https://${PWA_LIDERANCA_HOST:-lideranca-dev.logistica-processo.com}"
echo "  Portal:      https://${PORTAL_HOST:-portal-dev.logistica-processo.com}"

if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is empty."
  echo "Defina DATABASE_URL nas variáveis de ambiente da stack no Portainer."
  exit 1
fi

if [ ! -d node_modules/.pnpm ] || [ ! -f node_modules/.modules.yaml ]; then
  need_install=true
else
  need_install=false
  for app in api web pwa pwa-lideranca portal-terceiros; do
    if [ -f "apps/$app/package.json" ] && [ ! -e "apps/$app/node_modules" ]; then
      need_install=true
      break
    fi
  done
fi

if [ "$need_install" = true ]; then
  echo "Installing dependencies..."
  pnpm install --frozen-lockfile --ignore-scripts
  pnpm --filter @lilog/contracts build
fi

exec "$@"
