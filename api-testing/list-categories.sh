#!/usr/bin/env bash
# Lists furniture categories from the Cognitivo training API.
# This endpoint is unauthenticated (verified: no headers needed).
# Reads COGNITIVO_BASE_URL from .env rather than hardcoding it here.
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
source .env
set +a

curl -sS "${COGNITIVO_BASE_URL%/}/catalogue/categories"
