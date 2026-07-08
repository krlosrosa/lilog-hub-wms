#!/bin/bash
set -euo pipefail
STACK=/var/lib/docker/volumes/portainer_portainer_data/_data/compose/1/stack.env
sed -i 's/^WEB_HOST=.*/WEB_HOST=admin-dev.logistica-processo.com/' "$STACK"
sed -i 's/^PWA_HOST=.*/PWA_HOST=pwa-dev.logistica-processo.com/' "$STACK"
sed -i 's|gestao-dev|admin-dev|g' "$STACK"
sed -i 's|operacao-dev|pwa-dev|g' "$STACK"
grep -E '^(WEB_HOST|PWA_HOST|CORS_ORIGIN)=' "$STACK"
cd /var/lib/docker/volumes/portainer_portainer_data/_data/compose/1
docker compose --env-file stack.env -f docker-compose.dev.yml -p lilog-wms up -d --force-recreate devrunner
