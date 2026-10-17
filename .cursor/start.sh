#!/usr/bin/env bash
# Boot Postgres, apply Supabase SQL on vanilla Postgres, then start API and web.
set -euo pipefail

if [ -d /workspace ]; then
  cd /workspace
else
  cd "$(dirname "${BASH_SOURCE[0]}")/.."
fi
ROOT="$(pwd)"

export PATH="/usr/local/bin:${PATH}"
if [ -d "${HOME}/.nvm/versions/node" ]; then
  NVM_NODE="$(find "${HOME}/.nvm/versions/node" -type f -name node | sort | tail -1)"
  if [ -n "${NVM_NODE}" ]; then
    export PATH="$(dirname "${NVM_NODE}"):${PATH}"
  fi
fi

if ! command -v pg_isready >/dev/null 2>&1; then
  echo "PostgreSQL client is not installed. Run .cursor/install.sh first." >&2
  exit 1
fi

sudo service postgresql start
for _ in $(seq 1 30); do
  if pg_isready -q; then
    break
  fi
  sleep 1
done
pg_isready -q

sudo -u postgres psql -v ON_ERROR_STOP=1 -d postgres <<'SQL'
ALTER USER postgres WITH PASSWORD 'postgres';
SELECT 'CREATE DATABASE wuchan OWNER postgres'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'wuchan')\gexec
SQL

sudo -u postgres psql -v ON_ERROR_STOP=1 -d wuchan <<'SQL'
CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END
$$;
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  filename text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
SQL

if ! PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d wuchan -c 'SELECT 1' >/dev/null 2>&1; then
  HBA="$(sudo -u postgres psql -d postgres -tAc 'SHOW hba_file' | tr -d '[:space:]')"
  if [ -n "${HBA}" ] && [ -f "${HBA}" ]; then
    if ! sudo grep -qE '^host[[:space:]]+all[[:space:]]+postgres[[:space:]]+127\.0\.0\.1/32' "${HBA}"; then
      echo "host all postgres 127.0.0.1/32 scram-sha-256" | sudo tee -a "${HBA}" >/dev/null
    fi
    if ! sudo grep -qE '^host[[:space:]]+all[[:space:]]+postgres[[:space:]]+::1/128' "${HBA}"; then
      echo "host all postgres ::1/128 scram-sha-256" | sudo tee -a "${HBA}" >/dev/null
    fi
    sudo service postgresql reload
  fi
fi
PGPASSWORD=postgres psql -h 127.0.0.1 -U postgres -d wuchan -c 'SELECT 1' >/dev/null

if [ -d supabase/migrations ]; then
  for migration in supabase/migrations/*.sql; do
    [ -f "${migration}" ] || continue
    base="$(basename "${migration}")"
    applied="$(sudo -u postgres psql -d wuchan -tAc "SELECT 1 FROM public.schema_migrations WHERE filename = '${base}'" | tr -d '[:space:]')"
    if [ "${applied}" = "1" ]; then
      continue
    fi
    echo "Applying ${base}"
    sudo -u postgres psql -v ON_ERROR_STOP=1 -d wuchan -f "${migration}"
    sudo -u postgres psql -v ON_ERROR_STOP=1 -d wuchan -c "INSERT INTO public.schema_migrations (filename) VALUES ('${base}')"
  done
fi

if [ -f supabase/seed.sql ]; then
  sudo -u postgres psql -v ON_ERROR_STOP=1 -d wuchan -f supabase/seed.sql
fi

if [ ! -f package.json ]; then
  echo "Postgres is ready. No package.json on this revision; application servers were not started."
elif [ ! -d node_modules ] || [ ! -d packages/contracts/dist ]; then
  echo "Workspace dependencies are missing. Run .cursor/install.sh before start." >&2
  exit 1
else

start_session() {
  local name="$1"
  local cmd="$2"
  if tmux has-session -t "${name}" 2>/dev/null; then
    echo "tmux session ${name} already running"
    return 0
  fi
  tmux new-session -d -s "${name}" bash -lc "${cmd}"
}

start_session wuchan_api "cd ${ROOT} && DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/wuchan NODE_ENV=development ALLOW_DEV_AUTH=true PORT=3001 pnpm --filter @wuchan/api start:dev > /tmp/wuchan-api.log 2>&1"
start_session wuchan_web "cd ${ROOT} && WUCHAN_API_URL=http://127.0.0.1:3001 pnpm --filter @wuchan/web exec next dev -H 0.0.0.0 -p 3000 > /tmp/wuchan-web.log 2>&1"

wait_http() {
  local url="$1"
  local i
  for i in $(seq 1 90); do
    if curl -fsS "${url}" >/dev/null; then
      echo "ready ${url}"
      return 0
    fi
    sleep 1
  done
  echo "timed out waiting for ${url}" >&2
  return 1
}

wait_http "http://127.0.0.1:3001/catalog/products"
wait_http "http://127.0.0.1:3000/"
echo "WUCHAN API on :3001 and web on :3000"
fi
