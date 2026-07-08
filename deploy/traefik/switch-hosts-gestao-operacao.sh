#!/bin/bash
set -euo pipefail

STACK=/var/lib/docker/volumes/portainer_portainer_data/_data/compose/1
cd /root
export CF_DNS_API_TOKEN="$(grep '^CF_DNS_API_TOKEN=' .env | cut -d= -f2-)"
ZONE_ID=0ee23aa8ee324dc0810e473412655ae7
IP=157.173.119.218

CF_DNS_API_TOKEN="$CF_DNS_API_TOKEN" ZONE_ID="$ZONE_ID" IP="$IP" python3 <<'PY'
import json, os, urllib.request

token = os.environ["CF_DNS_API_TOKEN"]
zone = os.environ["ZONE_ID"]
ip = os.environ["IP"]
subs = ["gestao-dev", "operacao-dev"]

for sub in subs:
    fqdn = f"{sub}.logistica-processo.com"
    existing = json.load(
        urllib.request.urlopen(
            urllib.request.Request(
                f"https://api.cloudflare.com/client/v4/zones/{zone}/dns_records?name={fqdn}",
                headers={"Authorization": f"Bearer {token}"},
            )
        )
    )
    for r in existing.get("result", []):
        req = urllib.request.Request(
            f"https://api.cloudflare.com/client/v4/zones/{zone}/dns_records/{r['id']}",
            method="DELETE",
            headers={"Authorization": f"Bearer {token}"},
        )
        urllib.request.urlopen(req)

    body = json.dumps({
        "type": "A",
        "name": sub,
        "content": ip,
        "ttl": 1,
        "proxied": True,
    }).encode()
    req = urllib.request.Request(
        f"https://api.cloudflare.com/client/v4/zones/{zone}/dns_records",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    resp = json.load(urllib.request.urlopen(req))
    print(f"{fqdn}: {'OK' if resp.get('success') else resp}")
PY

sed -i 's/^WEB_HOST=.*/WEB_HOST=gestao-dev.logistica-processo.com/' "$STACK/stack.env"
sed -i 's/^PWA_HOST=.*/PWA_HOST=operacao-dev.logistica-processo.com/' "$STACK/stack.env"
sed -i 's|https://admin-dev.logistica-processo.com|https://gestao-dev.logistica-processo.com|g' "$STACK/stack.env"
sed -i 's|https://pwa-dev.logistica-processo.com|https://operacao-dev.logistica-processo.com|g' "$STACK/stack.env"

echo "=== stack.env hosts ==="
grep -E '^(WEB_HOST|PWA_HOST|CORS_ORIGIN)=' "$STACK/stack.env"

cd "$STACK"
docker compose --env-file stack.env -f docker-compose.dev.yml up -d --force-recreate devrunner

sleep 8
echo "=== traefik rules ==="
docker inspect lilog-dev --format '{{index .Config.Labels "traefik.http.routers.lilog-web-dev.rule"}}'
docker inspect lilog-dev --format '{{index .Config.Labels "traefik.http.routers.lilog-pwa-dev.rule"}}'

echo "=== HTTPS ==="
for sub in gestao-dev operacao-dev; do
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "https://${sub}.logistica-processo.com/" || echo ERR)
  echo "${sub}: ${code}"
done
