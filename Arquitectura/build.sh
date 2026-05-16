#!/usr/bin/env bash
set -euo pipefail

if command -v npm >/dev/null 2>&1; then
  cd frontend
  npm ci
  npm run build
  cd ..
else
  echo "npm no esta disponible; se usaran los assets frontend incluidos."
fi

pip install -r requirements.txt
