#!/bin/bash

# VPS Deployment Script for YouTube Downloader
# Run this script on your VPS to automatically set up the application

set -e

echo "🚀 Starting YouTube Downloader VPS deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_warning "Running as root. This script will create a non-root user for the application."
fi

# Update system packages
print_status "Updating system packages..."
if command -v apt-get &> /dev/null; then
    sudo apt-get update
    sudo apt-get upgrade -y
elif command -v yum &> /dev/null; then
    sudo yum update -y
fi

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    fi
else
    print_status "Node.js is already installed: $(node --version)"
fi

# Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    sudo npm install -g pm2
else
    print_status "PM2 is already installed: $(pm2 --version)"
fi

# Create application user if it doesn't exist
if ! id "ytdownloader" &>/dev/null; then
    print_status "Creating application user..."
    sudo useradd -m -s /bin/bash ytdownloader
fi

# Set up application directory
APP_DIR="/home/ytdownloader/youtube-downloader"
print_status "Setting up application directory: $APP_DIR"

# Create directory and set permissions
sudo mkdir -p $APP_DIR
sudo chown -R ytdownloader:ytdownloader $APP_DIR

# Switch to application user for the rest of the setup
print_status "Installing application dependencies..."

# Copy files to application directory (assuming current directory has the app)
sudo cp -r . $APP_DIR/
sudo chown -R ytdownloader:ytdownloader $APP_DIR

# Install dependencies as application user
sudo -u ytdownloader bash -c "cd $APP_DIR && npm install --production"

# Configure firewall
print_status "Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 3000
    sudo ufw --force enable
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=3000/tcp
    sudo firewall-cmd --reload
fi

# Start application with PM2
print_status "Starting application with PM2..."
sudo -u ytdownloader bash -c "cd $APP_DIR && pm2 start ecosystem.config.js"
sudo -u ytdownloader bash -c "cd $APP_DIR && pm2 save"

# Configure PM2 to start on system boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ytdownloader --hp /home/ytdownloader

# Install Nginx (optional)
read -p "Do you want to install and configure Nginx as a reverse proxy? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Installing Nginx..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get install -y nginx
    elif command -v yum &> /dev/null; then
        sudo yum install -y nginx
    fi
    
    # Configure Nginx
    read -p "Enter your domain name (or IP address): " DOMAIN
    
    sudo tee /etc/nginx/sites-available/youtube-downloader > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

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
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
EOF

    # Enable the site
    if [ -d "/etc/nginx/sites-enabled" ]; then
        sudo ln -sf /etc/nginx/sites-available/youtube-downloader /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
    fi
    
    # Test Nginx configuration
    sudo nginx -t
    
    # Start and enable Nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    print_status "Nginx configured successfully!"
    print_status "Your application will be available at: http://$DOMAIN"
else
    print_status "Skipping Nginx installation."
    print_status "Your application is available at: http://$(curl -s ifconfig.me):3000"
fi

# Show status
print_status "Deployment completed successfully! 🎉"
print_status ""
print_status "Application status:"
sudo -u ytdownloader bash -c "cd $APP_DIR && pm2 status"
print_status ""
print_status "Useful commands:"
print_status "  View logs: sudo -u ytdownloader pm2 logs youtube-downloader"
print_status "  Restart app: sudo -u ytdownloader pm2 restart youtube-downloader"
print_status "  Stop app: sudo -u ytdownloader pm2 stop youtube-downloader"
print_status ""
print_status "Security recommendations:"
print_status "  1. Set up SSL/TLS certificates (Let's Encrypt)"
print_status "  2. Configure proper firewall rules"
print_status "  3. Regularly update system packages"
print_status "  4. Monitor application logs"

print_status "Deployment script completed!"