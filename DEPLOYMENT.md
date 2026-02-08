# 🚀 FocusGuard - Production Deployment Guide

## Pre-Deployment Checklist

### 1. **Environment Setup**
- [ ] Copy `.env.production.example` to `.env`
- [ ] Generate strong passwords and secrets:
  ```bash
  # PostgreSQL password
  openssl rand -base64 32
  
  # JWT secret key
  openssl rand -hex 32
  ```
- [ ] Update `.env` with your production domain
- [ ] Set `DEBUG=False` in backend `.env`
- [ ] Configure CORS origins (no wildcards in production!)

### 2. **Security Verification**
- [ ] No `.env` files committed to git
- [ ] `JWT_SECRET_KEY` is unique and strong
- [ ] `POSTGRES_PASSWORD` is unique and strong
- [ ] HTTPS enabled (SSL certificates installed)
- [ ] Rate limiting enabled
- [ ] Sentry DSN configured (optional but recommended)

### 3. **Database Preparation**
- [ ] Review all migrations in `serv/database/init/`
- [ ] Ensure migrations are numbered sequentially
- [ ] Backup any existing data
- [ ] Test migrations on staging first

### 4. **Code Quality**
- [ ] All tests passing: `pytest -v --cov=api`
- [ ] No TODO/FIXME in critical paths
- [ ] Frontend builds without errors: `npm run build`
- [ ] TypeScript types validated: `tsc --noEmit`

---

## Deployment Methods

### Option 1: Docker Compose (Recommended for VPS)

**Requirements:**
- Docker 20.10+
- Docker Compose v2+
- 2GB RAM minimum
- 10GB disk space

**Steps:**

```bash
# 1. Clone repository
git clone https://github.com/yourusername/FocusGuard-ML.git
cd FocusGuard-ML

# 2. Configure environment
cp .env.production.example .env
nano .env  # Edit with your values

# 3. Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Check status
docker-compose -f docker-compose.prod.yml ps

# 5. View logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# 6. Access application
# Frontend: http://your-server-ip
# Backend API: http://your-server-ip:8000
# Swagger Docs: http://your-server-ip:8000/docs
```

**Health Checks:**
```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:80/health

# Database connection
docker exec focusguard-backend-prod python -c "from api.database import check_db_connection; import asyncio; asyncio.run(check_db_connection())"
```

---

### Option 2: Separate Services (Advanced)

#### A. Deploy Database
```bash
# PostgreSQL on managed service (e.g., AWS RDS, DigitalOcean)
# Or self-hosted:
docker run -d \
  --name focusguard-postgres \
  -e POSTGRES_USER=focusguard_user \
  -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
  -e POSTGRES_DB=focusguard_db \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine

# Run migrations
psql $DATABASE_URL -f serv/database/init/001_extensions.sql
psql $DATABASE_URL -f serv/database/init/002_users.sql
# ... run all migrations in order
```

#### B. Deploy Backend
```bash
# Build backend Docker image
cd serv
docker build -t focusguard-backend:latest .

# Run backend container
docker run -d \
  --name focusguard-backend \
  -e DATABASE_URL=${DATABASE_URL} \
  -e JWT_SECRET_KEY=${JWT_SECRET_KEY} \
  -e DEBUG=False \
  -p 8000:8000 \
  focusguard-backend:latest
```

#### C. Deploy Frontend
```bash
# Build frontend Docker image
cd client/focusguard-dashboard
docker build -t focusguard-frontend:latest .

# Run frontend container
docker run -d \
  --name focusguard-frontend \
  -p 80:80 \
  focusguard-frontend:latest
```

---

## Production Configuration

### Nginx Reverse Proxy (Recommended)

```nginx
# /etc/nginx/sites-available/focusguard

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Frontend
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTPS Backend API
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal (cron)
sudo certbot renew --dry-run
```

---

## Monitoring & Maintenance

### 1. Log Monitoring
```bash
# Real-time logs
docker-compose -f docker-compose.prod.yml logs -f

# Backend logs only
docker logs focusguard-backend-prod -f

# Frontend logs only
docker logs focusguard-frontend-prod -f
```

### 2. Database Backups
```bash
# Automated daily backup script
#!/bin/bash
# /opt/scripts/backup-focusguard-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/focusguard"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec focusguard-postgres-prod pg_dump -U focusguard_user focusguard_db | gzip > $BACKUP_DIR/postgres_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -type f -name "postgres_*.sql.gz" -mtime +30 -delete

# Upload to cloud (optional)
# aws s3 cp $BACKUP_DIR/postgres_$DATE.sql.gz s3://your-bucket/backups/
```

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * /opt/scripts/backup-focusguard-db.sh
```

### 3. Updates & Rollbacks
```bash
# Update to new version
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build

# Rollback if issues
docker-compose -f docker-compose.prod.yml down
git checkout <previous-commit>
docker-compose -f docker-compose.prod.yml up -d --build
```

### 4. Performance Monitoring
- **Sentry**: Error tracking and performance monitoring
- **Prometheus + Grafana**: Metrics dashboards
- **PostgreSQL pg_stat_statements**: Query performance

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker logs focusguard-backend-prod

# Common issues:
# 1. Database connection - verify DATABASE_URL
# 2. Missing migrations - run migrations manually
# 3. Port conflict - check if 8000 is in use
```

### Frontend won't build
```bash
# Check environment variables
cat client/focusguard-dashboard/.env

# Build locally to see errors
cd client/focusguard-dashboard
npm run build
```

### Database connection issues
```bash
# Test connection
docker exec focusguard-postgres-prod psql -U focusguard_user -d focusguard_db -c "SELECT 1"

# Check network
docker network inspect focusguard-network
```

---

## Performance Optimization

### 1. Database Tuning
```sql
-- Add indexes for frequent queries
CREATE INDEX CONCURRENTLY idx_sessions_user_created 
ON sessions(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_user_stats_current_streak 
ON user_stats(current_streak DESC);
```

### 2. Backend Scaling
```yaml
# docker-compose.prod.yml
backend:
  deploy:
    replicas: 3  # Run 3 instances
    resources:
      limits:
        cpus: '1'
        memory: 1G
```

### 3. Frontend Caching
Already configured in `nginx.conf`:
- Static assets: 1 year cache
- HTML: no cache
- Gzip compression enabled

---

## Security Hardening

### 1. Firewall Rules
```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 22/tcp    # SSH (restrict to your IP)
sudo ufw enable
```

### 2. Fail2ban (SSH Protection)
```bash
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Database Access
- Change default PostgreSQL port
- Use strong passwords (32+ characters)
- Restrict to Docker network only
- Enable SSL for external connections

---

## Cost Estimation

### VPS Requirements (Minimum)
- **2 vCPUs**
- **4GB RAM**
- **50GB SSD**
- **2TB bandwidth**

**Providers:**
- DigitalOcean: $24/month
- Hetzner: $10/month (cheaper!)
- Linode: $24/month
- AWS Lightsail: $20/month

### Optional Services
- Domain name: $10-15/year
- SSL certificate: FREE (Let's Encrypt)
- Sentry: FREE tier (5k errors/month)
- Managed PostgreSQL: $15+/month (optional)

---

## Post-Deployment Checklist

- [ ] All services running: `docker ps`
- [ ] Health checks passing
- [ ] SSL certificate installed and auto-renewing
- [ ] Backups configured and tested
- [ ] Monitoring/alerting set up (Sentry)
- [ ] DNS configured correctly
- [ ] Frontend loads at https://yourdomain.com
- [ ] Backend API accessible at https://api.yourdomain.com
- [ ] Swagger docs available at https://api.yourdomain.com/docs
- [ ] Test user registration/login
- [ ] Test session creation
- [ ] Test AI tutor (if API keys configured)
- [ ] Load testing (optional): `ab -n 1000 -c 10 https://api.yourdomain.com/health`

---

## Support & Resources

- **Documentation**: [README.md](README.md)
- **API Docs**: https://api.yourdomain.com/docs (once deployed)
- **DB Schema**: [serv/database/README.md](serv/database/README.md)
- **RAG System**: [serv/rag/README.md](serv/rag/README.md)

---

**Remember:** Always test in a staging environment before deploying to production!
