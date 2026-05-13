#!/bin/bash
# Gvault Server Setup Script (v2 - API Architecture)
# Run as root on 211.188.61.165

set -e

echo "===== Gvault Server Setup (v2) ====="

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

# 3) Install npm dependencies for scraper
echo "📦 Installing scraper dependencies..."
npm install playwright
npx playwright install --with-deps chromium

# 4) Generate API key if not exists
API_KEY_FILE="/opt/gvault/.api-key"
if [ ! -f "$API_KEY_FILE" ]; then
  API_KEY=$(openssl rand -hex 32)
  echo "$API_KEY" > "$API_KEY_FILE"
  chmod 600 "$API_KEY_FILE"
  echo "🔑 Generated API key: $API_KEY"
else
  API_KEY=$(cat "$API_KEY_FILE")
  echo "🔑 Using existing API key"
fi

# 5) Create K8s secret for API key
kubectl create secret generic gvault-secrets \
  --from-literal=api-key="$API_KEY" \
  -n gvault --dry-run=client -o yaml | kubectl apply -f -

# 6) Create cron wrapper (scraper calls API, no more git push)
cat > /opt/gvault/scripts/cron-scrape.sh << 'CRONEOF'
#!/bin/bash
LOG="/var/log/gvault-scraper.log"

# Random delay: 0-900 seconds (0~15 min)
DELAY=$(( RANDOM % 900 ))
echo "[$(date)] Sleeping ${DELAY}s before scraping..." >> $LOG
sleep $DELAY

cd /opt/gvault
git pull origin main >> $LOG 2>&1 || true

# API endpoint (K3S ClusterIP service)
export GVAULT_API_URL="http://gvault.gvault.svc.cluster.local/api"
export GVAULT_API_KEY=$(cat /opt/gvault/.api-key)

# X (Twitter) API - load from .env if exists
if [ -f /opt/gvault/.env ]; then
  export $(grep -E '^TWITTER_' /opt/gvault/.env | xargs)
fi

# Run scraper → posts to API
echo "[$(date)] Starting scraper..." >> $LOG
node scripts/scrape-coupons.mjs >> $LOG 2>&1

echo "[$(date)] Done" >> $LOG
CRONEOF
chmod +x /opt/gvault/scripts/cron-scrape.sh

# 7) Setup cron (3 runs per day at staggered times ≈ 8h intervals)
CRON_LINE1="17 3 * * * /opt/gvault/scripts/cron-scrape.sh"
CRON_LINE2="42 11 * * * /opt/gvault/scripts/cron-scrape.sh"
CRON_LINE3="8 20 * * * /opt/gvault/scripts/cron-scrape.sh"

# Remove old entries and add new
(crontab -l 2>/dev/null | grep -v 'cron-scrape.sh'; echo "$CRON_LINE1"; echo "$CRON_LINE2"; echo "$CRON_LINE3") | crontab -

# 8) Create log rotation
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
echo "🔑 API Key: $API_KEY_FILE"
echo "📋 Cron schedule (UTC):"
crontab -l | grep cron-scrape
echo "📝 Log: /var/log/gvault-scraper.log"
echo ""
echo "🧪 Test run:"
echo "  export GVAULT_API_URL=http://gvault.gvault.svc.cluster.local/api"
echo "  export GVAULT_API_KEY=\$(cat /opt/gvault/.api-key)"
echo "  cd /opt/gvault && node scripts/scrape-coupons.mjs"
