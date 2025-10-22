# SSL Certificate Setup Instructions

This directory should contain your SSL certificates for production deployment.

## Option 1: Let's Encrypt (Recommended for production)

1. Install certbot on your server
2. Run: `certbot certonly --webroot -w /var/www/certbot -d yourdomain.com -d www.yourdomain.com`
3. Copy certificates to this directory:
   - `fullchain.pem` - Full certificate chain
   - `privkey.pem` - Private key

## Option 2: Self-Signed Certificate (Development/Testing Only)

Generate a self-signed certificate for testing:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout privkey.pem \
  -out fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=yourdomain.com"
```

## Files Required:
- `fullchain.pem` - SSL certificate (full chain)
- `privkey.pem` - Private key

**IMPORTANT**: Never commit actual certificates to version control!
Add `*.pem` to .gitignore
