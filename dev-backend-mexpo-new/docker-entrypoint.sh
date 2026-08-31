#!/bin/sh
set -e

echo "==> Starting Mexpo Backend Container..."

DB_HOST_VAL="${DB_HOST:-postgres}"
DB_PORT_VAL="${DB_PORT:-5432}"

if [ "$DB_HOST_VAL" = "postgres" ]; then
  echo "==> Waiting for Postgres database at $DB_HOST_VAL:$DB_PORT_VAL..."
  RETRIES=30
  while ! nc -z "$DB_HOST_VAL" "$DB_PORT_VAL" 2>/dev/null; do
    RETRIES=$((RETRIES - 1))
    if [ "$RETRIES" -le 0 ]; then
      echo "==> Timeout waiting for database. Proceeding anyway..."
      break
    fi
    sleep 1
  done
  echo "==> Database check finished."
fi

echo "==> Running Prisma migrations (prisma migrate deploy)..."
npx prisma migrate deploy || {
  echo "==> Warning: Prisma migrate deploy encountered an error or no pending migrations. Proceeding..."
}

echo "==> Starting application..."
exec "$@"
