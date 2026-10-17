#!/usr/bin/env bash
# Idempotent Cloud Agent install: Node/pnpm on PATH, workspace deps, local Postgres.
set -euo pipefail

if [ -d /workspace ]; then
  cd /workspace
else
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
fi

NODE_BIN=""
if [ -d "${HOME}/.nvm/versions/node" ]; then
  NODE_BIN="$(find "${HOME}/.nvm/versions/node" -type f -name node ! -path '*/exec-daemon/*' | sort | tail -1)"
fi
if [ -z "${NODE_BIN}" ]; then
  NODE_BIN="$(command -v node || true)"
fi
if [[ "${NODE_BIN}" == /exec-daemon/* ]]; then
  echo "Refusing runtime-only Node at ${NODE_BIN}." >&2
  exit 1
fi
if [ -z "${NODE_BIN}" ] || [ ! -x "${NODE_BIN}" ]; then
  echo "Node.js 20+ is required but was not found." >&2
  exit 1
fi

NODE_DIR="$(dirname "${NODE_BIN}")"
export PATH="${NODE_DIR}:/usr/local/bin:${PATH}"

sudo ln -sfn "${NODE_BIN}" /usr/local/bin/node
[ -x "${NODE_DIR}/npm" ] && sudo ln -sfn "${NODE_DIR}/npm" /usr/local/bin/npm
[ -x "${NODE_DIR}/npx" ] && sudo ln -sfn "${NODE_DIR}/npx" /usr/local/bin/npx
[ -x "${NODE_DIR}/corepack" ] && sudo ln -sfn "${NODE_DIR}/corepack" /usr/local/bin/corepack

NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
if [ "${NODE_MAJOR}" -lt 20 ]; then
  echo "Node.js >= 20 is required, found $(node -v)." >&2
  exit 1
fi

corepack enable
corepack prepare pnpm@10.18.3 --activate
if [ -x "${NODE_DIR}/pnpm" ]; then
  sudo ln -sfn "${NODE_DIR}/pnpm" /usr/local/bin/pnpm
else
  PNPM_BIN="$(command -v pnpm || true)"
  if [ -z "${PNPM_BIN}" ]; then
    echo "corepack did not install pnpm." >&2
    exit 1
  fi
  sudo ln -sfn "${PNPM_BIN}" /usr/local/bin/pnpm
fi

hash -r
echo "Using node $(node -v) at $(command -v node) and pnpm $(pnpm -v) at $(command -v pnpm)"

sudo DEBIAN_FRONTEND=noninteractive apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib tmux

if [ -f package.json ]; then
  pnpm install --frozen-lockfile
  pnpm --filter @wuchan/contracts build
  pnpm --filter @wuchan/validation build
  echo "WUCHAN install complete."
else
  echo "No package.json on this revision; system packages are installed and workspace install was skipped."
fi
