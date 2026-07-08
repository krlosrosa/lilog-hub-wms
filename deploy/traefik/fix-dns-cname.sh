#!/bin/bash
set -euo pipefail

cd /root
export CF_DNS_API_TOKEN="$(grep '^CF_DNS_API_TOKEN=' .env | cut -d= -f2-)"
CNAME_TARGET="portal-dev.logistica-processo.com"

# Subdomínios com NXDOMAIN no DNS do roteador/ISP — CNAME para portal-dev (já resolve)
SUBDOMAINS=(admin-dev pwa-dev)

ZONE_JSON=$(curl -sS -H "Authorization: Bearer ${CF_DNS_API_TOKEN}" \
  "https://api.cloudflare.com/client/v4/zones?name=logistica-processo.com")
ZONE_ID=$(echo "$ZONE_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0]['id'] if d.get('result') else '')")

echo "ZONE_ID=${ZONE_ID} CNAME_TARGET=${CNAME_TARGET}"

CF_DNS_API_TOKEN="$CF_DNS_API_TOKEN" ZONE_ID="$ZONE_ID" CNAME_TARGET="$CNAME_TARGET" SUBDOMAINS="${SUBDOMAINS[*]}" python3 <<'PY'
import json, os, urllib.request

token = os.environ["CF_DNS_API_TOKEN"]
zone = os.environ["ZONE_ID"]
target = os.environ["CNAME_TARGET"]
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

    for rec in records:
        if rec["type"] in ("A", "CNAME"):
            req = urllib.request.Request(
                f"https://api.cloudflare.com/client/v4/zones/{zone}/dns_records/{rec['id']}",
                method="DELETE",
                headers={"Authorization": f"Bearer {token}"},
            )
            urllib.request.urlopen(req)
            print(f"deleted {rec['type']} {fqdn} -> {rec.get('content')}")

    body = json.dumps({
        "type": "CNAME",
        "name": sub,
        "content": target,
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
        print(f"CNAME {fqdn} -> {target} (proxied)")
    else:
        print(f"FAILED {fqdn}: {resp}")
PY

echo
echo "=== DNS (1.1.1.1) ==="
for sub in api-dev admin-dev pwa-dev lideranca-dev portal-dev; do
  printf "%s: " "$sub"
  dig +short "$sub.logistica-processo.com" @1.1.1.1 | tr '\n' ' '
  echo
done

echo
echo "=== HTTPS ==="
for sub in api-dev admin-dev pwa-dev lideranca-dev portal-dev; do
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "https://${sub}.logistica-processo.com/" || echo ERR)
  echo "${sub}: ${code}"
done
