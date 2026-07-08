#!/bin/bash
set -euo pipefail
cd /root
export CF_DNS_API_TOKEN="$(grep '^CF_DNS_API_TOKEN=' .env | cut -d= -f2-)"
IP=157.173.119.218
bash /root/fix-dns-records.sh 2>&1 | tail -20
