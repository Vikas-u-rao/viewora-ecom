#!/bin/bash
set -e

# ─── Viewora Deployment Script ───────────────────────────────────────
# Run this on a fresh Ubuntu VPS (Hostinger Mumbai or any)
# Usage: chmod +x setup.sh && ./setup.sh
# ──────────────────────────────────────────────────────────────────────

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Viewora Deployment Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── CONFIGURE THESE ───────────────────────────────────────────────────
DOMAIN="yourdomain.com"            # Your domain (without www)
API_DOMAIN="api.yourdomain.com"    # API subdomain
DB_PASSWORD="change_this_password" # PostgreSQL password
GIT_REPO="https://github.com/YOUR_USER/viewora.git"  # Your repo URL
# ──────────────────────────────────────────────────────────────────────

# ── 1. System Update & Dependencies ──────────────────────────────────
echo ">>> Updating system..."
apt update && apt upgrade -y

echo ">>> Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v && npm -v

echo ">>> Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

echo ">>> Installing Nginx, Certbot, Git..."
apt install -y nginx certbot python3-certbot-nginx git

# ── 2. Database Setup ────────────────────────────────────────────────
echo ">>> Creating PostgreSQL database..."
sudo -u postgres psql -c "CREATE USER viewora WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE viewora OWNER viewora;"
sudo -u postgres psql -c "ALTER USER viewora CREATEDB;"

# ── 3. Clone Repository ──────────────────────────────────────────────
echo ">>> Cloning repository..."
cd /var
mkdir -p www
cd /var/www
git clone $GIT_REPO viewora
cd viewora

# ── 4. Environment Variables ────────────────────────────────────────
echo ">>> Setting up environment variables..."

# Server .env
cat > /var/www/viewora/server/.env << EOF
DATABASE_URL="postgresql://viewora:$DB_PASSWORD@localhost:5432/viewora?schema=public"
JWT_SECRET="$(openssl rand -hex 32)"
JWT_REFRESH_SECRET="$(openssl rand -hex 32)"
ACCESS_TOKEN_EXPIRY="15m"
REFRESH_TOKEN_EXPIRY="7d"
CLIENT_URL="https://$DOMAIN"
PORT=5000
NODE_ENV=production
EOF

# Client .env.local
cat > /var/www/viewora/client/.env.local << EOF
NEXT_PUBLIC_API_URL="https://$API_DOMAIN/api/v1"
EOF

# ── 5. Install Dependencies & Build ──────────────────────────────────
echo ">>> Installing server dependencies..."
cd /var/www/viewora/server
npm install

echo ">>> Building server TypeScript..."
npm run build

echo ">>> Running Prisma migrations..."
npx prisma generate
npx prisma migrate deploy

echo ">>> Installing client dependencies..."
cd /var/www/viewora/client
npm install

echo ">>> Building Next.js..."
npm run build

# ── 6. PM2 Setup ─────────────────────────────────────────────────────
echo ">>> Setting up PM2..."
npm install -g pm2

cd /var/www/viewora/server
pm2 start npm --name "viewora-server" -- run start
pm2 save

cd /var/www/viewora/client
pm2 start npm --name "viewora-client" -- run start
pm2 save

pm2 startup systemd -u root --hp /root

# ── 7. Nginx Configuration ───────────────────────────────────────────
echo ">>> Configuring Nginx..."

# Main domain → Next.js (port 3000)
cat > /etc/nginx/sites-available/$DOMAIN << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# API subdomain → Express (port 5000)
cat > /etc/nginx/sites-available/$API_DOMAIN << EOF
server {
    listen 80;
    server_name $API_DOMAIN;

    client_max_body_size 10m;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/$API_DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl restart nginx

# ── 8. SSL Certificates ──────────────────────────────────────────────
echo ">>> Obtaining SSL certificates..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN
certbot --nginx -d $API_DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN

# ── 9. Firewall ──────────────────────────────────────────────────────
echo ">>> Configuring firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

# ── 10. Done ─────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Frontend: https://$DOMAIN"
echo "  API:      https://$API_DOMAIN"
echo "  DB:       postgresql://viewora@localhost:5432/viewora"
echo ""
echo "  Next steps:"
echo "  1. Point your GoDaddy DNS:"
echo "     - A record @ → (your VPS IP)"
echo "     - A record api → (your VPS IP)"
echo "  2. Monitor: pm2 list"
echo "  3. Logs:    pm2 logs"
echo "  4. Restart: pm2 restart all"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
