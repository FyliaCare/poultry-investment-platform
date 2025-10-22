# Production Deployment Guide

This guide covers deploying the Poultry Investment Platform to production.

## Prerequisites

- Docker and Docker Compose installed on your server
- Domain name configured with DNS pointing to your server
- SSL certificate (Let's Encrypt recommended)
- PostgreSQL database credentials
- Strong secret keys generated

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/FyliaCare/poultry-investment-platform.git
cd poultry-investment-platform
```

### 2. Configure Environment Variables

Copy the example environment file and customize it:

```bash
cp .env.production.example .env
```

Edit `.env` and replace ALL placeholder values:

```bash
# Generate a strong JWT secret
DB_PASSWORD=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)

# Set your domain
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
VITE_API_URL=https://api.yourdomain.com

# Set admin email
ADMIN_EMAIL=admin@yourdomain.com
```

### 3. Setup SSL Certificates

#### Option A: Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to nginx directory
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
sudo chmod 644 nginx/ssl/fullchain.pem
sudo chmod 600 nginx/ssl/privkey.pem
```

#### Option B: Self-Signed (Testing Only)

```bash
cd nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout privkey.pem \
  -out fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
cd ../..
```

### 4. Update Nginx Configuration

Edit `nginx/nginx.conf` and replace `yourdomain.com` with your actual domain.

### 5. Build and Deploy

```bash
# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 6. Verify Deployment

```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# Test health endpoint
curl https://yourdomain.com/health

# Check API documentation
curl https://yourdomain.com/docs
```

### 7. Create Admin User

1. Register a user account through the web interface
2. Access the database and manually set `is_admin = true`:

```bash
# Connect to database
docker-compose -f docker-compose.prod.yml exec db psql -U poultry_user -d poultry_db

# Set user as admin (replace user_id with actual ID)
UPDATE users SET is_admin = true WHERE id = 1;
\q
```

## Security Checklist

- [ ] All environment variables use strong, unique values
- [ ] SSL certificates are valid and properly configured
- [ ] Database password is strong and unique
- [ ] JWT_SECRET is a strong random string
- [ ] CORS_ORIGINS is set to your actual domain(s) only
- [ ] Seed endpoint is disabled (automatically disabled in production)
- [ ] Database backups are configured
- [ ] Firewall rules allow only necessary ports (80, 443)
- [ ] Server is kept up to date with security patches

## Database Migrations

Migrations run automatically on container startup. To run manually:

```bash
docker-compose -f docker-compose.prod.yml exec api alembic upgrade head
```

## Backup and Restore

### Backup Database

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U poultry_user poultry_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Or use automated backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U poultry_user poultry_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore Database

```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Start only database
docker-compose -f docker-compose.prod.yml up -d db

# Restore backup
cat backup.sql | docker-compose -f docker-compose.prod.yml exec -T db psql -U poultry_user poultry_db

# Start all services
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f db
```

### Check Service Health

```bash
# API health
curl https://yourdomain.com/health

# Database connection
docker-compose -f docker-compose.prod.yml exec api python -c "from app.database import engine; engine.connect()"
```

## SSL Certificate Renewal

Let's Encrypt certificates expire every 90 days. Set up auto-renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Setup cron job for auto-renewal
sudo crontab -e

# Add this line to renew daily at 2am
0 2 * * * certbot renew --quiet --post-hook "cp /etc/letsencrypt/live/yourdomain.com/*.pem /path/to/nginx/ssl/ && docker-compose -f /path/to/docker-compose.prod.yml restart web"
```

## Scaling

### Increase Database Resources

Edit `docker-compose.prod.yml`:

```yaml
services:
  db:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

### Add API Replicas

```yaml
services:
  api:
    deploy:
      replicas: 3
```

Then add a load balancer (nginx, traefik, or cloud provider's load balancer).

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Verify environment variables
docker-compose -f docker-compose.prod.yml config

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Database Connection Issues

```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps db

# Test database connection
docker-compose -f docker-compose.prod.yml exec db pg_isready -U poultry_user

# Check database logs
docker-compose -f docker-compose.prod.yml logs db
```

### SSL Certificate Issues

```bash
# Verify certificate files exist
ls -la nginx/ssl/

# Check certificate expiry
openssl x509 -in nginx/ssl/fullchain.pem -noout -dates

# Test SSL configuration
curl -vI https://yourdomain.com
```

## Production Updates

### Deploy Code Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart services with zero-downtime
docker-compose -f docker-compose.prod.yml up -d --build --no-deps api web

# Run migrations if needed
docker-compose -f docker-compose.prod.yml exec api alembic upgrade head
```

### Rollback

```bash
# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild and deploy
docker-compose -f docker-compose.prod.yml up -d --build --no-deps api web

# Rollback migrations if needed
docker-compose -f docker-compose.prod.yml exec api alembic downgrade -1
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_PASSWORD` | PostgreSQL password | `strong_random_password` |
| `JWT_SECRET` | JWT signing secret | `hex_string_64_chars` |
| `ADMIN_EMAIL` | Admin user email | `admin@yourdomain.com` |
| `CORS_ORIGINS` | Allowed CORS origins | `https://yourdomain.com` |
| `VITE_API_URL` | Frontend API URL | `https://api.yourdomain.com` |

## Support

For issues or questions:
- Check logs: `docker-compose -f docker-compose.prod.yml logs`
- Review this guide
- Contact: admin@yourdomain.com

## Next Steps

1. Set up monitoring (Prometheus, Grafana, or cloud provider monitoring)
2. Configure automated backups
3. Set up log aggregation (ELK stack, CloudWatch, etc.)
4. Implement payment gateway integration
5. Set up CI/CD pipeline
6. Configure CDN for static assets
7. Implement rate limiting and DDoS protection

---

**Security Notice**: Never commit `.env` files or SSL certificates to version control. Always use strong, unique passwords and secrets.
