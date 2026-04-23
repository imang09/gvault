#!/bin/bash
# Gvault Scraper - Server Setup Script
# Run as root on 211.188.61.165

set -e

echo "===== Gvault Scraper Setup ====="

# 1) Install Node.js 20 if not present
if ! command -v node &>/dev/null; then
  echo "📦 Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "✅ Node.js $(node -v)"

# 2) Clone or update repo
SCRAPER_DIR="/opt/gvault"
if [ -d "$SCRAPER_DIR/.git" ]; then
  echo "📥 Updating repo..."
  cd "$SCRAPER_DIR"
  git pull origin main
else
  echo "📥 Cloning repo..."
  rm -rf "$SCRAPER_DIR"
  git clone https://github.com/imang09/gvault.git "$SCRAPER_DIR"
  cd "$SCRAPER_DIR"
fi

# 3) Configure git for auto-push
git config user.name "gvault-scraper[bot]"
git config user.email "scraper@gvault.local"

# 4) Install npm dependencies
echo "📦 Installing dependencies..."
npm install playwright
npx playwright install --with-deps chromium

# 5) Create cron wrapper with random delay + auto deploy
cat > /opt/gvault/scripts/cron-scrape.sh << 'CRONEOF'
#!/bin/bash
LOG="/var/log/gvault-scraper.log"

# Random delay: 0-900 seconds (0~15 min)
DELAY=$(( RANDOM % 900 ))
echo "[$(date)] Sleeping ${DELAY}s before scraping..." >> $LOG
sleep $DELAY

cd /opt/gvault
git pull origin main >> $LOG 2>&1 || true

# Run scraper
echo "[$(date)] Starting scraper..." >> $LOG
node scripts/scrape-coupons.mjs >> $LOG 2>&1

# If coupons were pushed, rebuild & redeploy
if git log --oneline -1 | grep -q "data:"; then
  echo "[$(date)] New coupons pushed, rebuilding..." >> $LOG
  git pull origin main >> $LOG 2>&1
  docker build -t ghcr.io/imang09/gvault:latest . >> $LOG 2>&1
  docker save ghcr.io/imang09/gvault:latest | k3s ctr images import - >> $LOG 2>&1
  kubectl rollout restart deployment gvault -n gvault >> $LOG 2>&1
  echo "[$(date)] Deploy complete" >> $LOG
fi

echo "[$(date)] Done" >> $LOG
CRONEOF
chmod +x /opt/gvault/scripts/cron-scrape.sh

# 6) Setup cron (3 runs per day at staggered times ≈ 8h intervals)
CRON_LINE1="17 3 * * * /opt/gvault/scripts/cron-scrape.sh"
CRON_LINE2="42 11 * * * /opt/gvault/scripts/cron-scrape.sh"
CRON_LINE3="8 20 * * * /opt/gvault/scripts/cron-scrape.sh"

# Remove old entries and add new
(crontab -l 2>/dev/null | grep -v 'cron-scrape.sh'; echo "$CRON_LINE1"; echo "$CRON_LINE2"; echo "$CRON_LINE3") | crontab -

# 7) Create log rotation
cat > /etc/logrotate.d/gvault-scraper << 'LOGEOF'
/var/log/gvault-scraper.log {
    weekly
    rotate 4
    compress
    missingok
    notifempty
}
LOGEOF

echo ""
echo "===== Setup Complete ====="
echo "📁 Repo: $SCRAPER_DIR"
echo "📋 Cron schedule (UTC):"
crontab -l | grep cron-scrape
echo "📝 Log: /var/log/gvault-scraper.log"
echo ""
echo "🧪 Test run: cd /opt/gvault && node scripts/scrape-coupons.mjs"
