#!/usr/bin/env bash
# Fetches the logged-in user's real balance from the Cognitivo training API.
# This endpoint requires the x-api-key header (unlike the catalogue ones).
# Reads COGNITIVO_BASE_URL / COGNITIVO_API_KEY / COGNITIVO_USERNAME from
# .env rather than hardcoding them here.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
source .env
set +a

curl -sS "${COGNITIVO_BASE_URL%/}/users/${COGNITIVO_USERNAME}" \
  -H "x-api-key: ${COGNITIVO_API_KEY}" \
  -H "Accept: application/json"
