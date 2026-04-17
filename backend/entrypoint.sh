#!/bin/sh
set -e

# Apply database migrations
echo "Running migrations..."
python manage.py migrate --noinput || true

# Collect static files (no-op if not configured)
echo "Collecting static files..."
python manage.py collectstatic --noinput || true

echo "Starting Django development server on 0.0.0.0:8000"
exec python manage.py runserver 0.0.0.0:8000
