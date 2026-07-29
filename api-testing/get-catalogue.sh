#!/usr/bin/env bash
# Fetches the full catalogue from the Cognitivo training API.
# This endpoint is unauthenticated (verified: no headers needed), but
# unlike search-index it appears to return full embedded images for
# every product, so it can be slow/large — capped with a 30s timeout.
# Reads COGNITIVO_BASE_URL from .env rather than hardcoding it here.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
source .env
set +a

curl -sS --max-time 30 "${COGNITIVO_BASE_URL%/}/catalogue" \
  -H "Accept: application/json"
