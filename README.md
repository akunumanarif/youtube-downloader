# YouTube Downloader

A simple, full-stack JavaScript YouTube video downloader that can be deployed to a VPS server for remote access.

## Features

- **Web-based Interface**: Clean, responsive UI accessible from any device
- **Video Information Preview**: Shows title, author, duration, thumbnail, and view count
- **Quality Selection**: Choose from available video qualities
- **Direct Download**: Stream videos directly to users' devices
- **Error Handling**: Robust error handling for invalid URLs and network issues
- **Mobile Friendly**: Responsive design works on desktop and mobile
- **VPS Ready**: Easy deployment to remote servers

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **YouTube Integration**: play-dl library (reliable alternative to ytdl-core)
- **Security**: Helmet.js, CORS enabled
- **File Handling**: sanitize-filename for safe downloads

## Local Development

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (comes with Node.js)

### Installation

1. Clone or download this project
2. Navigate to the project directory:
   ```bash
   cd YtDownloader
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   Or for production:
   ```bash
   npm start
   ```

5. Open your browser and visit: `http://localhost:3000`

## VPS Deployment

### Method 1: Basic VPS Setup

#### Step 1: Server Requirements
- Ubuntu 20.04+ or CentOS 7+ (recommended)
- At least 1GB RAM
- Node.js v14+ installed
- Port 3000 open (or your preferred port)

#### Step 2: Install Node.js on VPS
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

#### Step 3: Upload Your Project
```bash
# Using SCP (from your local machine)
scp -r YtDownloader username@your-server-ip:/home/username/

# Or clone from Git (on your VPS)
git clone https://github.com/yourusername/YtDownloader.git
cd YtDownloader
```

#### Step 4: Install Dependencies and Start
```bash
cd YtDownloader
npm install --production
npm start
```

#### Step 5: Configure Firewall
```bash
# Ubuntu (UFW)
sudo ufw allow 3000

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

### Method 2: Using PM2 (Production Recommended)

PM2 is a process manager that keeps your app running and automatically restarts it if it crashes.

#### Install PM2
```bash
sudo npm install -g pm2
```

#### Create PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'youtube-downloader',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

#### Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Method 3: Using Docker

#### Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

USER node

CMD ["npm", "start"]
```

#### Create docker-compose.yml
```yaml
version: '3.8'

services:
  youtube-downloader:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```

#### Deploy with Docker
```bash
docker-compose up -d
```

### Method 4: Using Nginx Reverse Proxy

#### Install Nginx
```bash
# Ubuntu
sudo apt update && sudo apt install nginx

# CentOS
sudo yum install nginx
```

#### Configure Nginx
Create `/etc/nginx/sites-available/youtube-downloader`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

#### Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/youtube-downloader /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Environment Variables

You can customize the application using environment variables:

```bash
# Port (default: 3000)
export PORT=8080

# Node environment
export NODE_ENV=production
```

## Security Considerations

1. **Firewall**: Only open necessary ports
2. **HTTPS**: Use SSL certificates in production (Let's Encrypt recommended)
3. **Updates**: Keep dependencies updated
4. **Rate Limiting**: Consider implementing rate limiting for production use
5. **Domain Restriction**: Optionally restrict access by domain/IP

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   sudo lsof -i :3000
   sudo kill -9 PID
   ```

2. **Permission denied**:
   ```bash
   sudo chown -R $USER:$USER /path/to/project
   ```

3. **ytdl-core errors**: If you encounter YouTube API errors, the library handles this automatically with play-dl. If issues persist, try updating:
   ```bash
   npm update play-dl
   ```

4. **Video unavailable**: Some videos may be region-restricted or private. The application will show appropriate error messages.

### Logs

- Check application logs: `pm2 logs youtube-downloader`
- Check system logs: `sudo journalctl -u nginx`
- Check Node.js errors in the console output

## API Endpoints

- `GET /` - Main application interface
- `POST /api/video-info` - Get video metadata
- `POST /api/download` - Download video
- `POST /api/formats` - Get available video formats
- `GET /api/health` - Health check endpoint

## Usage

1. Open the application in your browser
2. Paste a YouTube URL in the input field
3. Click "Get Info" to preview the video
4. Select desired quality
5. Click "Download Video" to start the download

## Legal Notice

This tool is for educational purposes only. Please respect copyright laws and only download videos that you have permission to download. The developers are not responsible for any misuse of this application.

## License

MIT License - feel free to modify and distribute as needed.

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify your Node.js version is 14+
3. Ensure all dependencies are properly installed
4. Check server logs for error messages

For additional help, please check the project documentation or create an issue in the project repository.