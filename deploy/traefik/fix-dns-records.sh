#!/bin/bash
set -euo pipefail

cd /root
export CF_DNS_API_TOKEN="$(grep '^CF_DNS_API_TOKEN=' .env | cut -d= -f2-)"
SERVER_IP="$(curl -4 -s ifconfig.me)"

SUBDOMAINS=(
  api-dev
  admin-dev
  pwa-dev
  lideranca-dev
  portal-dev
  storage-dev
  storage-console-dev
)

ZONE_JSON=$(curl -sS -H "Authorization: Bearer ${CF_DNS_API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/zones?name=logistica-processo.com")
ZONE_ID=$(echo "$ZONE_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0]['id'] if d.get('result') else '')")

if [ -z "$ZONE_ID" ]; then
  echo "ERROR: zone logistica-processo.com not found"
  exit 1
fi

echo "ZONE_ID=${ZONE_ID}"
echo "SERVER_IP=${SERVER_IP}"
echo

CF_DNS_API_TOKEN="$CF_DNS_API_TOKEN" ZONE_ID="$ZONE_ID" SERVER_IP="$SERVER_IP" SUBDOMAINS="${SUBDOMAINS[*]}" python3 <<'PY'
import json, os, urllib.request

token = os.environ["CF_DNS_API_TOKEN"]
zone = os.environ["ZONE_ID"]
ip = os.environ["SERVER_IP"]
names = os.environ["SUBDOMAINS"].split()

existing = json.load(
    urllib.request.urlopen(
        urllib.request.Request(
            f"https://api.cloudflare.com/client/v4/zones/{zone}/dns_records?per_page=100",
            headers={"Authorization": f"Bearer {token}"},
        )
    )
)

by_name = {}
for r in existing.get("result", []):
    by_name.setdefault(r["name"], []).append(r)

for sub in names:
    fqdn = f"{sub}.logistica-processo.com"
    records = by_name.get(fqdn, [])

    a_rec = next((r for r in records if r.get("type") == "A"), None)
    if a_rec and a_rec.get("content") == ip and a_rec.get("proxied"):
        print(f"OK exists: {fqdn} -> {a_rec.get('content')} proxied=True")
        continue

    for rec in records:
        req = urllib.request.Request(
            f"https://api.cloudflare.com/client/v4/zones/{zone}/dns_records/{rec['id']}",
            method="DELETE",
            headers={"Authorization": f"Bearer {token}"},
        )
        urllib.request.urlopen(req)
        print(f"deleted {rec['type']} {fqdn}")

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
    if resp.get("success"):
        print(f"CREATED: {fqdn} -> {ip} (proxied)")
    else:
        print(f"FAILED: {fqdn}: {resp}")
PY

echo
echo "=== DNS check (1.1.1.1) ==="
for sub in "${SUBDOMAINS[@]}"; do
  printf "%s: " "$sub"
  dig +short A "${sub}.logistica-processo.com" @1.1.1.1 | tr '\n' ' '
  echo
done

echo
echo "=== HTTP check ==="
for sub in "${SUBDOMAINS[@]}"; do
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "https://${sub}.logistica-processo.com" || echo ERR)
  echo "${sub}: ${code}"
done
