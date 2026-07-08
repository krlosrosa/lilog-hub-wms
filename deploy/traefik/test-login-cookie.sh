#!/bin/bash
curl -sS -D /tmp/login-headers.txt -o /tmp/login-body.txt \
  -X POST "https://api-dev.logistica-processo.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "Origin: https://admin-dev.logistica-processo.com" \
  -d '{"id":1,"password":"test"}'
grep -i set-cookie /tmp/login-headers.txt || echo "NO SET-COOKIE (login may have failed auth)"
head -c 300 /tmp/login-body.txt
echo
