#!/usr/bin/env bash
set -e

echo "==> Pre-deploy: Running database migrations..."
alembic upgrade head
echo "==> Migrations complete!"
