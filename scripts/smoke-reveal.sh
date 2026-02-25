#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
CODE="${2:-DF000001}"

echo "[SMOKE] Health"
curl -sS "$BASE_URL/api/health" || true
printf "\n\n"

echo "[SMOKE] Collection"
curl -sS "$BASE_URL/api/collection" | head -c 350 || true
printf "\n\n"

echo "[SMOKE] Remaining"
curl -sS "$BASE_URL/api/stats/remaining" || true
printf "\n\n"

echo "[SMOKE] Reveal code=$CODE"
curl -sS "$BASE_URL/api/reveal?code=$CODE" || true
printf "\n"
