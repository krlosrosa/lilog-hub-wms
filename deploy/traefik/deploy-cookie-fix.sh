#!/bin/bash
set -euo pipefail

STACK=/var/lib/docker/volumes/portainer_portainer_data/_data/compose/1
LOCAL=/c/Users/421931/Desktop/lilog-hub-2027

grep -q '^COOKIE_DOMAIN=' "$STACK/stack.env" || echo 'COOKIE_DOMAIN=.logistica-processo.com' >> "$STACK/stack.env"
grep -q '^COOKIE_SECURE=' "$STACK/stack.env" || echo 'COOKIE_SECURE=true' >> "$STACK/stack.env"
sed -i 's|^COOKIE_DOMAIN=.*|COOKIE_DOMAIN=.logistica-processo.com|' "$STACK/stack.env"
sed -i 's|^COOKIE_SECURE=.*|COOKIE_SECURE=true|' "$STACK/stack.env"

grep -E '^(COOKIE_DOMAIN|COOKIE_SECURE)=' "$STACK/stack.env"

cd "$STACK"
docker compose --env-file stack.env -f docker-compose.dev.yml -p lilog-wms build devrunner
docker compose --env-file stack.env -f docker-compose.dev.yml -p lilog-wms up -d --force-recreate devrunner

sleep 20
docker exec lilog-dev grep -E '^(COOKIE_DOMAIN|COOKIE_SECURE)=' /app/apps/api/.env || true
docker logs lilog-dev 2>&1 | grep -iE 'API running|error' | tail -5
