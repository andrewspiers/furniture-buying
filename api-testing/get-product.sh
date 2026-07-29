#!/usr/bin/env bash
# Fetches a single product by item_id from the Cognitivo training API.
# This endpoint is unauthenticated (verified: no headers needed).
# Reads COGNITIVO_BASE_URL from .env rather than hardcoding it here.
#
# Usage: ./get-product.sh [item_id]   (defaults to 00368814, "Bar table")
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
source .env
set +a

item_id="${1:-00368814}"

curl -sS "${COGNITIVO_BASE_URL%/}/catalogue/${item_id}" \
  -H "Accept: application/json"
