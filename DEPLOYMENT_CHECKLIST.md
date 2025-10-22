# Production Deployment Checklist

Use this checklist before deploying to production.

## Pre-Deployment

### Environment Configuration
- [ ] Created `.env` file from `.env.production.example`
- [ ] Generated strong JWT_SECRET (run: `openssl rand -hex 32`)
- [ ] Generated strong DB_PASSWORD (run: `openssl rand -hex 32`)
- [ ] Updated ADMIN_EMAIL with actual admin email
- [ ] Updated CORS_ORIGINS with actual domain(s)
- [ ] Updated VITE_API_URL with actual API domain
- [ ] Verified all placeholder values are replaced

### SSL/TLS Setup
- [ ] Obtained SSL certificate (Let's Encrypt or other)
- [ ] Copied `fullchain.pem` to `nginx/ssl/`
- [ ] Copied `privkey.pem` to `nginx/ssl/`
- [ ] Set proper permissions on certificate files (644 for fullchain, 600 for privkey)
- [ ] Updated `nginx/nginx.conf` with actual domain name

### DNS Configuration
- [ ] Domain points to server IP address
- [ ] www subdomain configured (if applicable)
- [ ] DNS propagation completed (check with `nslookup yourdomain.com`)

### Server Setup
- [ ] Docker installed and running
- [ ] Docker Compose installed
- [ ] Firewall configured (allow ports 80, 443)
- [ ] Server has sufficient resources (min 2GB RAM, 20GB disk)
- [ ] Backups configured for PostgreSQL data

## Deployment

### Build & Start
- [ ] Cloned repository to server
- [ ] Copied `.env` file to project root
- [ ] SSL certificates in place
- [ ] Run: `docker-compose -f docker-compose.prod.yml up -d --build`
- [ ] All services started successfully
- [ ] Database migrations completed

### Verification
- [ ] Health endpoint responds: `curl https://yourdomain.com/health`
- [ ] Frontend loads: `https://yourdomain.com`
- [ ] API docs accessible: `https://yourdomain.com/docs`
- [ ] Registration works
- [ ] Login works
- [ ] Check logs for errors: `docker-compose -f docker-compose.prod.yml logs`

### Admin Setup
- [ ] Created admin user account
- [ ] Set user as admin in database
- [ ] Verified admin can access admin endpoints
- [ ] Seed endpoint returns 403 (disabled in production)

## Security

### Access Control
- [ ] Admin credentials are secure
- [ ] Database not accessible from public internet
- [ ] Only necessary ports open (80, 443)
- [ ] SSH key-based authentication enabled
- [ ] Root login disabled

### Application Security
- [ ] All secrets are strong and unique
- [ ] No hardcoded credentials in code
- [ ] CORS properly configured
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers configured in nginx

### Data Protection
- [ ] Database backups scheduled
- [ ] Backup restoration tested
- [ ] `.env` file NOT in version control
- [ ] SSL certificates NOT in version control
- [ ] `.gitignore` properly configured

## Post-Deployment

### Monitoring
- [ ] Set up log monitoring
- [ ] Configure uptime monitoring
- [ ] Set up error alerting
- [ ] Monitor disk usage
- [ ] Monitor database size

### Maintenance
- [ ] SSL certificate auto-renewal configured
- [ ] Database backup automation configured
- [ ] Update schedule planned
- [ ] Rollback procedure documented
- [ ] Emergency contacts listed

### Documentation
- [ ] Deployment documented
- [ ] Credentials stored securely (password manager)
- [ ] Server details documented
- [ ] Runbook created for common tasks

## Optional Enhancements

### Performance
- [ ] CDN configured for static assets
- [ ] Database query optimization
- [ ] Caching layer (Redis)
- [ ] Load balancer for multiple instances

### Integration
- [ ] Payment gateway integrated (Paystack/MoMo)
- [ ] Email service configured (SendGrid/AWS SES)
- [ ] SMS notifications (Twilio)
- [ ] Analytics (Google Analytics/Mixpanel)

### DevOps
- [ ] CI/CD pipeline configured
- [ ] Automated testing in pipeline
- [ ] Staging environment set up
- [ ] Blue-green deployment strategy

## Emergency Procedures

### If Site Goes Down
1. Check service status: `docker-compose -f docker-compose.prod.yml ps`
2. Check logs: `docker-compose -f docker-compose.prod.yml logs`
3. Restart services: `docker-compose -f docker-compose.prod.yml restart`
4. Check database: `docker-compose -f docker-compose.prod.yml exec db pg_isready`

### If Database Corrupts
1. Stop services
2. Restore from latest backup
3. Run migrations
4. Start services
5. Verify data integrity

### If Need to Rollback
1. `git checkout <previous-commit>`
2. `docker-compose -f docker-compose.prod.yml up -d --build`
3. Run migrations if needed
4. Verify functionality

---

**Date Deployed**: ___________________

**Deployed By**: ___________________

**Version**: ___________________

**Notes**: 
_________________________________________________
_________________________________________________
_________________________________________________
