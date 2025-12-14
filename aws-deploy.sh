#!/bin/bash

# AWS Deployment Script for Sahni Tata Backend
# This script automates the EC2 setup process

set -e

echo "🚀 Starting AWS Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on EC2
if [ ! -f "/etc/os-release" ]; then
    echo -e "${RED}Error: This script should be run on the EC2 instance${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Updating system...${NC}"
sudo apt update && sudo apt upgrade -y

echo -e "${GREEN}Step 2: Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

echo -e "${GREEN}Step 3: Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    echo "PM2 already installed"
fi

echo -e "${GREEN}Step 4: Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl enable nginx
else
    echo "Nginx already installed"
fi

echo -e "${GREEN}Step 5: Installing Git...${NC}"
if ! command -v git &> /dev/null; then
    sudo apt install -y git
else
    echo "Git already installed"
fi

echo -e "${GREEN}Step 6: Cloning repository...${NC}"
if [ ! -d "sahni_tata" ]; then
    git clone https://github.com/Stackvil/sahni_tata.git
else
    echo "Repository already exists, pulling latest changes..."
    cd sahni_tata
    git pull
    cd ..
fi

echo -e "${GREEN}Step 7: Installing backend dependencies...${NC}"
cd sahni_tata/backend
npm install --production

echo -e "${YELLOW}Step 8: Checking .env file...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating template...${NC}"
    cat > .env << EOF
NODE_ENV=production
PORT=3001

# JWT
JWT_SECRET=your-strong-secret-key-change-this

# AWS S3
AWS_BUCKET_NAME=tata-storagebucket
AWS_REGION_NAME=ap-south-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id-here
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key-here
AWS_CLOUDFRONT_DOMAIN=https://dh0blbvvlqdiy.cloudfront.net

# AWS RDS
AWS_RDS_HOST=database-1.cfeiaikgk6qo.ap-south-1.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_DBNAME=sahanidatabase
AWS_RDS_USERNAME=postgres
AWS_RDS_PASSWORD=your-rds-password-here
EOF
    echo -e "${YELLOW}⚠️  Please edit .env file with your actual values!${NC}"
    echo "Run: nano .env"
else
    echo "✅ .env file exists"
fi

echo -e "${GREEN}Step 9: Initializing database...${NC}"
if [ -f "scripts/init-database.js" ]; then
    node scripts/init-database.js || echo "⚠️  Database initialization had issues (may already be initialized)"
else
    echo "⚠️  init-database.js not found, skipping..."
fi

echo -e "${GREEN}Step 10: Starting application with PM2...${NC}"
if pm2 list | grep -q "sahni-backend"; then
    echo "Application already running, restarting..."
    pm2 restart sahni-backend
else
    pm2 start server.js --name sahni-backend
    pm2 save
    pm2 startup
fi

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit .env file if needed: nano .env"
echo "2. Configure Nginx: sudo nano /etc/nginx/sites-available/sahni-backend"
echo "3. Setup SSL: sudo certbot --nginx -d your-domain.com"
echo "4. Run migration: node scripts/migrate-all-to-postgres.js"
echo ""
echo "Useful commands:"
echo "  pm2 logs sahni-backend    # View logs"
echo "  pm2 status                # Check status"
echo "  pm2 restart sahni-backend # Restart app"


