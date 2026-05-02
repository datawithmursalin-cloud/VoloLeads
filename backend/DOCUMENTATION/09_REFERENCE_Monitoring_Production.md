# Monitoring & Maintenance Guide

## Production Monitoring

### Application Health Check
```bash
curl https://api.yourdomain.com/api/health
```

### Response Status
- `200 OK` - API is healthy
- Any other status - Check logs immediately

---

## Log Management

### View Logs via SSH
```bash
# Real-time logs (last 50 lines)
tail -f /path/to/logs/app.log

# Check for errors
grep ERROR /path/to/logs/app.log | tail -20

# Check specific time range
tail -n 1000 /path/to/logs/app.log | grep "2024-05-02"
```

### Log Rotation
Configure logrotate for automatic log management:
```bash
sudo nano /etc/logrotate.d/vololeads-api
```

Add:
```
/path/to/logs/*.log {
  daily
  rotate 14
  compress
  delaycompress
  notifempty
  missingok
}
```

---

## Performance Monitoring

### CPU & Memory Usage
```bash
# Using htop (if installed)
htop

# Using top
top

# Using ps (process-specific)
ps aux | grep node
```

### Database Connection Monitoring
Monitor MongoDB connections:
```bash
mongosh
> db.currentOp()
> db.killOp(12345)
```

---

## Backup Strategy

### Database Backups
```bash
# MongoDB backup
mongodump --uri="your-connection-string" --out=/backups/mongo-backup-$(date +%Y%m%d)

# Restore
mongorestore --uri="your-connection-string" --dir=/backups/mongo-backup-20240502
```

### Application Backups
```bash
# Backup application directory
tar -czf ~/backups/api-backup-$(date +%Y%m%d).tar.gz ~/api/

# Backup database
mysqldump -u root -p database_name > ~/backups/db-backup-$(date +%Y%m%d).sql
```

### Automated Backup Script
Create `/home/username/backup.sh`:
```bash
#!/bin/bash

BACKUP_DIR="/home/username/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --uri="your-connection-string" --out=$BACKUP_DIR/mongo-$DATE

# Backup application
tar -czf $BACKUP_DIR/api-$DATE.tar.gz /home/username/api/

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;

echo "Backup completed at $DATE"
```

Schedule with crontab:
```bash
crontab -e
# Add: 0 2 * * * /home/username/backup.sh
```

---

## Security Updates

### Check for Vulnerabilities
```bash
npm audit
npm audit fix
```

### Update Dependencies
```bash
# Check for outdated packages
npm outdated

# Update all packages
npm update

# Update to latest major version (use with caution)
npm install -g npm-check-updates
ncu -u
npm install
```

---

## Restart Application

### Using systemd (if configured)
```bash
sudo systemctl restart vololeads-api
sudo systemctl status vololeads-api
```

### Manual Restart
```bash
# Kill the process
kill $(lsof -t -i :5000)

# Or using PM2
pm2 restart app
```

---

## Database Maintenance

### MongoDB
```bash
# Connect to MongoDB
mongosh "your-connection-string"

# Rebuild indexes
db.users.reIndex()

# Check database size
db.stats()

# Remove old records (example: older than 1 year)
db.logs.deleteMany({ createdAt: { $lt: new Date("2023-05-02") } })
```

---

## SSL/TLS Certificate Renewal

### Using cPanel AutoSSL
Certificates auto-renew 30 days before expiration.

### Manual Renewal
```bash
# Check certificate expiration
openssl s_client -connect api.yourdomain.com:443 -showcerts | grep -i "notAfter"

# Renew via Let's Encrypt (if using)
certbot renew --force-renewal
```

---

## Monitoring Alerts

### Setup Email Alerts
Configure cPanel to email you on:
- High CPU/Memory usage
- Disk space critical
- Service down
- Database errors

### Manual Status Check Script
Create `/home/username/check-status.sh`:
```bash
#!/bin/bash

API_URL="https://api.yourdomain.com/api/health"
EMAIL="admin@yourdomain.com"

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $RESPONSE -ne 200 ]; then
    echo "API is DOWN (HTTP $RESPONSE)" | mail -s "Alert: API Down" $EMAIL
else
    echo "API is UP (HTTP $RESPONSE)"
fi
```

Schedule with crontab:
```bash
# Every 5 minutes
*/5 * * * * /home/username/check-status.sh
```

---

## Performance Optimization

### Enable Caching
- Add Redis for session/data caching
- Implement HTTP caching headers
- Compress API responses (already enabled with helmet)

### Database Optimization
```bash
# Create indexes
db.users.createIndex({ email: 1 })
db.logs.createIndex({ createdAt: -1 })

# Analyze slow queries
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().pretty()
```

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 10 https://api.yourdomain.com/api/health

# Using wrk
wrk -t4 -c100 -d30s https://api.yourdomain.com/api/health
```

---

## Troubleshooting

### Application Won't Start
1. Check logs: `tail -f /path/to/logs/app.log`
2. Check port: `lsof -i :5000`
3. Check environment: `echo $PATH`, verify Node.js is installed
4. Test: `node -v`, `npm -v`

### High Memory Usage
1. Check for memory leaks: `node --inspect`
2. Review code for large data structures
3. Restart application: `npm restart`

### Database Connection Issues
1. Verify connection string
2. Check MongoDB is running: `ps aux | grep mongod`
3. Test connectivity: `mongosh "connection-string"`

### SSL Certificate Issues
1. Check expiration: cPanel → SSL/TLS Status
2. Renew if needed: cPanel → AutoSSL
3. Clear browser cache

---

## Maintenance Checklist

### Weekly
- [ ] Check application health: `/api/health`
- [ ] Review error logs
- [ ] Check disk space: `df -h`

### Monthly
- [ ] Update dependencies: `npm outdated`
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Review database size and performance
- [ ] Test database backups

### Quarterly
- [ ] Full security audit
- [ ] Performance analysis
- [ ] Update documentation
- [ ] Review and update deployment procedures

### Annually
- [ ] Major dependency updates
- [ ] Architecture review
- [ ] Disaster recovery test
- [ ] Capacity planning

---

## Contact & Support
For issues, refer to [CPANEL_DEPLOYMENT.md](./CPANEL_DEPLOYMENT.md)
