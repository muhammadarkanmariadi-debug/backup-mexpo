#!/bin/sh
set -e

echo "==> Starting Mexpo Backend Container..."

# If running against postgres container, optionally wait a few seconds or attempt migration
if [ "$DB_HOST" = "postgres" ]; then
  echo "==> Waiting for Postgres database at $DB_HOST:$DB_PORT..."
  while ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
    sleep 1
  done
  echo "==> Postgres is reachable."
fi

# Run Prisma database migrations
echo "==> Running Prisma migrations (prisma migrate deploy)..."
npx prisma migrate deploy || {
  echo "==> Warning: Prisma migrate deploy encountered an error. Proceeding..."
}

echo "==> Starting application..."
exec "$@"
