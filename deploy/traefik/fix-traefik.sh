#!/bin/bash
set -euo pipefail
cd /root

export CF_DNS_API_TOKEN="$(grep '^CF_DNS_API_TOKEN=' .env | cut -d= -f2-)"

echo "=== Token verify ==="
curl -sS -H "Authorization: Bearer ${CF_DNS_API_TOKEN}" \
  https://api.cloudflare.com/client/v4/user/tokens/verify
echo

ZONE_JSON=$(curl -sS -H "Authorization: Bearer ${CF_DNS_API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/zones?name=logistica-processo.com")
ZONE_ID=$(echo "$ZONE_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0]['id'] if d.get('result') else '')")
echo "ZONE_ID=${ZONE_ID}"

if [ -n "$ZONE_ID" ]; then
  echo "=== Cleaning stale _acme-challenge TXT records ==="
  RECORDS=$(curl -sS -H "Authorization: Bearer ${CF_DNS_API_TOKEN}" \
    "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=TXT&per_page=100")
  echo "$RECORDS" | CF_DNS_API_TOKEN="$CF_DNS_API_TOKEN" ZONE_ID="$ZONE_ID" python3 -c "
import sys, json, os, urllib.request
data = json.load(sys.stdin)
token = os.environ['CF_DNS_API_TOKEN']
zone = os.environ['ZONE_ID']
for r in data.get('result', []):
    name = r.get('name', '')
    if '_acme-challenge' in name:
        rid = r['id']
        req = urllib.request.Request(
            f'https://api.cloudflare.com/client/v4/zones/{zone}/dns_records/{rid}',
            method='DELETE',
            headers={'Authorization': f'Bearer {token}'},
        )
        with urllib.request.urlopen(req) as resp:
            print('deleted', name)
"
fi

cp -a letsencrypt/acme.json "letsencrypt/acme.json.bkp.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true

echo "=== Restart Traefik ==="
docker compose down traefik || true
docker compose pull traefik
docker compose up -d traefik
sleep 10
docker logs traefik 2>&1 | tail -30
