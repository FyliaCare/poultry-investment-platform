FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code from backend directory
COPY backend/app ./app

# Copy migrations from root
COPY migrations ./migrations

# Copy alembic config from root
COPY alembic.ini ./alembic.ini

# Create startup script
RUN echo '#!/bin/bash\n\
set -e\n\
echo "==> Checking database connection..."\n\
echo "DATABASE_URL configured: ${DATABASE_URL:+YES}"\n\
echo "==> Running database migrations..."\n\
python -m alembic upgrade head || { echo "Migration failed!"; exit 1; }\n\
echo "==> Migrations complete!"\n\
echo "==> Starting application..."\n\
exec uvicorn app.main:app --host 0.0.0.0 --port 8000\n\
' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 8000

CMD ["/bin/bash", "/app/start.sh"]
