#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.portainer.yml}"

echo "==> Rebuild PWA (sem cache Docker)..."
docker compose -f "$COMPOSE_FILE" build --no-cache pwa pwa-lideranca

echo "==> Subindo containers..."
docker compose -f "$COMPOSE_FILE" up -d pwa pwa-lideranca

echo "==> Verificando deploy..."
docker exec lilog-pwa ls -la /usr/share/nginx/html/sw.js
docker exec lilog-pwa-lideranca ls -la /usr/share/nginx/html/sw.js

echo ""
echo "Deploy concluído."
echo "Se usar Cloudflare: Purge Cache nos domínios PWA."
echo "No celular: se ainda ver versão antiga, limpe dados do app ou toque em 'Atualizar' no toast."
