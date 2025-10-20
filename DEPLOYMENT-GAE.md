# Google App Engine Deployment Guide

This guide will help you deploy the YouTube Downloader to Google App Engine.

## Prerequisites

1. **Google Cloud Account**: Create a free account at [cloud.google.com](https://cloud.google.com)
2. **Google Cloud SDK**: Install the `gcloud` CLI tool
3. **Project Setup**: Create a new Google Cloud project

## Setup Steps

### 1. Install Google Cloud SDK

**Windows:**
```powershell
# Download and install from: https://cloud.google.com/sdk/docs/install
# Or use PowerShell:
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

**macOS:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### 2. Initialize Google Cloud SDK

```bash
# Login to your Google account
gcloud auth login

# Create a new project (replace PROJECT_ID with your desired project ID)
gcloud projects create YOUR_PROJECT_ID

# Set the project as default
gcloud config set project YOUR_PROJECT_ID

# Enable App Engine API
gcloud services enable appengine.googleapis.com

# Initialize App Engine (choose your preferred region)
gcloud app create --region=us-central
```

### 3. Prepare Your Application

The following files are already configured for App Engine deployment:

- ✅ `app.yaml` - App Engine configuration
- ✅ `cloudbuild.yaml` - Build configuration (optional)
- ✅ `.gcloudignore` - Files to exclude from deployment
- ✅ `package.json` - Dependencies and scripts

### 4. Deploy to App Engine

#### Simple Deployment (Recommended)

```bash
# Navigate to your project directory
cd path/to/YtDownloader

# Deploy to App Engine
gcloud app deploy

# Open your deployed app in browser
gcloud app browse
```

#### Advanced Deployment with Cloud Build

```bash
# Submit build to Cloud Build (uses cloudbuild.yaml)
gcloud builds submit

# Or deploy with specific version
gcloud app deploy --version=v1 --no-promote
```

## Configuration Details

### app.yaml Configuration

```yaml
runtime: nodejs18          # Node.js 18 runtime
env_variables:
  NODE_ENV: production     # Production environment
  PORT: 8080              # App Engine uses port 8080

automatic_scaling:        # Auto-scaling configuration
  min_instances: 0        # Scale to zero when not in use
  max_instances: 10       # Maximum 10 instances
  target_cpu_utilization: 0.6  # Scale when CPU > 60%

resources:               # Resource allocation
  cpu: 1                 # 1 CPU core
  memory_gb: 1          # 1GB RAM
```

### Environment Variables

You can add custom environment variables in `app.yaml`:

```yaml
env_variables:
  NODE_ENV: production
  PORT: 8080
  CUSTOM_VAR: "your_value"
```

## Deployment Commands

### Basic Commands

```bash
# Deploy the application
gcloud app deploy

# Deploy with specific version
gcloud app deploy --version=v2

# Deploy without promoting to live traffic
gcloud app deploy --no-promote

# View application logs
gcloud app logs tail -s default

# Open the deployed application
gcloud app browse
```

### Monitoring and Management

```bash
# View application versions
gcloud app versions list

# View application services
gcloud app services list

# Scale a service
gcloud app services set-traffic default --splits=v1=100

# View real-time logs
gcloud app logs tail -s default

# SSH into an instance (for debugging)
gcloud app instances ssh INSTANCE_ID --service=default
```

## Cost Optimization

### Free Tier Limits

Google App Engine offers a generous free tier:
- **28 instance hours per day**
- **1GB outbound traffic per day**
- **5GB Cloud Storage**

### Cost-Saving Tips

1. **Use automatic scaling** with `min_instances: 0`
2. **Monitor usage** in the Google Cloud Console
3. **Set up billing alerts** to avoid unexpected charges
4. **Use efficient instance sizes** (start with 1 CPU, 1GB RAM)

## Security Considerations

### 1. Enable HTTPS Only

The `app.yaml` already includes:
```yaml
handlers:
- url: /.*
  script: auto
  secure: always  # Forces HTTPS
```

### 2. Set Up Custom Domain (Optional)

```bash
# Map a custom domain
gcloud app domain-mappings create example.com
```

### 3. Configure Firewall Rules

```bash
# Create firewall rule (if needed)
gcloud app firewall-rules create 1000 --action=allow --source-range=0.0.0.0/0
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   gcloud app logs tail -s default
   
   # Verify app.yaml syntax
   gcloud app deploy --dry-run
   ```

2. **Memory Issues**
   - Increase memory in `app.yaml`: `memory_gb: 2`
   - Monitor memory usage in Cloud Console

3. **Timeout Issues**
   - App Engine has a 60-second request timeout
   - Consider using task queues for long-running operations

4. **Module Not Found Errors**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules
   npm install
   gcloud app deploy
   ```

### Debugging

```bash
# View detailed logs
gcloud app logs read --service=default --limit=100

# Check application health
gcloud app services describe default

# View scaling metrics
gcloud app services describe default --format="table(id,split.allocations)"
```

## Updating Your Application

```bash
# Deploy new version
gcloud app deploy --version=v2

# Gradually migrate traffic
gcloud app services set-traffic default --splits=v1=50,v2=50

# Complete migration
gcloud app services set-traffic default --splits=v2=100

# Delete old version
gcloud app versions delete v1
```

## Example Deployment Flow

```bash
# 1. Prepare your code
git add .
git commit -m "Prepare for App Engine deployment"

# 2. Deploy to App Engine
gcloud app deploy

# 3. Test the deployment
gcloud app browse

# 4. Monitor the application
gcloud app logs tail -s default
```

## Support and Resources

- **Google Cloud Documentation**: [cloud.google.com/appengine/docs](https://cloud.google.com/appengine/docs)
- **App Engine Pricing**: [cloud.google.com/appengine/pricing](https://cloud.google.com/appengine/pricing)
- **Node.js on App Engine**: [cloud.google.com/appengine/docs/standard/nodejs](https://cloud.google.com/appengine/docs/standard/nodejs)

## Your Application URLs

After deployment, your YouTube Downloader will be available at:
- `https://YOUR_PROJECT_ID.uc.r.appspot.com`
- Custom domain (if configured): `https://your-domain.com`

Remember to share this URL with your friends so they can use the YouTube downloader!