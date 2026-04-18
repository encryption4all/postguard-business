#!/bin/sh
set -e

if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_FULL_NAME" ] && [ -n "$ADMIN_PHONE" ]; then
  echo "Seeding admin account..."
  node --experimental-strip-types scripts/seed.ts
fi

echo "Starting application..."
exec node build
