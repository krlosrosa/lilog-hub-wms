#!/bin/bash
set -euo pipefail
STACK=/var/lib/docker/volumes/portainer_portainer_data/_data/compose/1/stack.env

CORS="https://admin-dev.logistica-processo.com,https://pwa-dev.logistica-processo.com,https://lideranca-dev.logistica-processo.com,https://portal-dev.logistica-processo.com,https://gestao-dev.logistica-processo.com,https://operacao-dev.logistica-processo.com"

sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=${CORS}|" "$STACK"
sed -i 's|&channel_binding=require||g' "$STACK"

echo "=== CORS_ORIGIN ==="
grep '^CORS_ORIGIN=' "$STACK"

cd /var/lib/docker/volumes/portainer_portainer_data/_data/compose/1
docker compose --env-file stack.env -f docker-compose.dev.yml -p lilog-wms up -d --force-recreate devrunner

sleep 15
echo "=== apps/api/.env CORS ==="
docker exec lilog-dev grep '^CORS_ORIGIN=' /app/apps/api/.env

echo "=== DB test ==="
docker exec lilog-dev sh -c 'cd /app/apps/api && node --input-type=module -e "
import postgres from \"postgres\";
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
try {
  const r = await sql\`select 1 as ok\`;
  console.log(\"DB_OK\", r[0]);
} catch (e) {
  console.log(\"DB_FAIL\", e.message);
} finally {
  await sql.end({ timeout: 5 });
}
"' 2>&1 | tail -5
