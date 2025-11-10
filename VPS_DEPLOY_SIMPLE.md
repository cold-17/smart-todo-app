# Deploy to VPS - Simple Step-by-Step Guide

**Time: 1-2 hours | Cost: $6/month | Result: todos.charlieold.com**

---

## Part 1: Create Your Server (15 minutes)

### Step 1: Sign up for DigitalOcean

1. Go to: https://www.digitalocean.com
2. Click **"Sign Up"**
3. Create account (you'll get $200 free credit for 60 days!)
4. Add payment method (won't be charged during free trial)

### Step 2: Create a Droplet (Virtual Server)

1. Click **"Create"** → **"Droplets"**

2. **Choose Region:**
   - Select closest to you (e.g., "New York" or "San Francisco")

3. **Choose Image:**
   - Select **"Ubuntu 24.04 LTS"**

4. **Choose Size:**
   - Click **"Basic"**
   - Select **"Regular"**
   - Choose: **$6/month** (1GB RAM, 25GB SSD)

5. **Authentication:**
   - Select **"Password"** (easier for first time)
   - Create a strong password and save it!
   - (Or use SSH key if you know how)

6. **Finalize:**
   - Hostname: `smart-todo-vps`
   - Click **"Create Droplet"**

7. **Wait 2 minutes** for server to be ready

8. **Copy the IP address** (looks like: `123.45.67.89`)
   - You'll see it on the Droplets page
   - Save this somewhere!

---

## Part 2: Set Up Your Server (20 minutes)

### Step 3: Connect to Your Server

**On Mac/Linux:**
```bash
ssh root@YOUR_IP_ADDRESS
# Replace YOUR_IP_ADDRESS with your actual IP
# Type 'yes' when asked about fingerprint
# Enter the password you created
```

**On Windows:**
- Download PuTTY: https://putty.org
- Host Name: `root@YOUR_IP_ADDRESS`
- Click "Open"
- Enter password when prompted

### Step 4: Run the Setup Script

Once connected, copy and paste these commands **one at a time**:

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Install other tools
apt install git nano -y

# Create app directory
mkdir -p /opt/smart-todo-app
cd /opt/smart-todo-app

# You're ready!
echo "✅ Server setup complete!"
```

**This takes about 5-10 minutes.** Lots of text will scroll by - that's normal!

---

## Part 3: Deploy Your App (15 minutes)

### Step 5: Get Your Code on the Server

Still in the SSH terminal:

```bash
# Clone your repository (replace with your GitHub username)
git clone https://github.com/YOUR_USERNAME/smart-todo-app.git .

# If repository is private, it will ask for GitHub credentials
```

### Step 6: Create Environment File

```bash
# Create production environment file
nano .env.docker
```

This opens a text editor. **Copy and paste this** (update the values):

```env
# MongoDB Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=ChangeThisToSomethingSecure123!
MONGODB_URI=mongodb://admin:ChangeThisToSomethingSecure123!@mongodb:27017/smart-todo-app?authSource=admin

# JWT Secret (generate a random one)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long-make-it-random

# URLs - Update after Step 8!
CLIENT_URL=https://todos.charlieold.com
VITE_API_URL=https://todos.charlieold.com/api

# OpenAI (optional - leave blank if you don't have it)
OPENAI_API_KEY=
```

**To save and exit:**
- Press `Ctrl + X`
- Press `Y` (yes to save)
- Press `Enter` (confirm filename)

### Step 7: Generate Secure Secrets

Let's make your JWT secret actually secure:

```bash
# Generate a secure random secret
openssl rand -base64 32

# This outputs something like: xK9mP2nQ7vR8wS3tU4yV5zA6bC7dE8fG9hI0jK1lM2n=
```

**Copy that output**, then:

```bash
# Open the file again
nano .env.docker

# Replace the JWT_SECRET value with what you just generated
# Save with Ctrl+X, Y, Enter
```

### Step 8: Start Your App

```bash
# Start all services with Docker Compose
docker-compose -f docker-compose.prod.yml --env-file .env.docker up -d

# This takes 2-5 minutes first time (downloads images and builds)
```

**Check if it's running:**
```bash
docker-compose -f docker-compose.prod.yml ps

# You should see 3 services running:
# - smart-todo-backend-prod
# - smart-todo-frontend-prod
# - smart-todo-mongodb-prod
```

**Test it:**
```bash
curl http://localhost:5000/health

# Should return: {"status":"ok",...}
```

✅ **Your app is now running on the server!**

---

## Part 4: Set Up Domain & SSL (30 minutes)

### Step 9: Point Your Domain to the Server

1. **Go to your domain registrar** (where you bought charlieold.com)
   - Could be: Namecheap, GoDaddy, Google Domains, Cloudflare, etc.

2. **Find DNS settings** (also called "DNS Management" or "Nameservers")

3. **Add an A Record:**
   ```
   Type: A
   Name: todos
   Value: YOUR_SERVER_IP_ADDRESS
   TTL: 3600 (or Auto)
   ```

4. **Save changes**

5. **Wait 5-15 minutes** for DNS to propagate
   - Test with: `ping todos.charlieold.com`
   - Should show your server IP

### Step 10: Install SSL Certificate (HTTPS)

Back in your SSH terminal:

```bash
# Install Nginx (web server for SSL)
apt install nginx certbot python3-certbot-nginx -y

# Create Nginx configuration
nano /etc/nginx/sites-available/smart-todo
```

**Copy and paste this configuration:**

```nginx
# Backend API
server {
    listen 80;
    server_name todos.charlieold.com;

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000/health;
        proxy_set_header Host $host;
    }

    # Socket.io for real-time features
    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Frontend (serve from Nginx container on port 80)
    location / {
        proxy_pass http://localhost:80/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Save:** `Ctrl+X`, `Y`, `Enter`

**Enable the configuration:**
```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/smart-todo /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test configuration
nginx -t

# Should say "syntax is ok" and "test is successful"

# Restart Nginx
systemctl restart nginx
```

**Get SSL certificate (HTTPS):**
```bash
# This is automatic and FREE!
certbot --nginx -d todos.charlieold.com

# Follow the prompts:
# - Enter your email
# - Agree to terms
# - Choose: Redirect HTTP to HTTPS (option 2)
```

✅ **You now have HTTPS!** Certificate auto-renews every 90 days.

---

## Part 5: Test Your Live App! (5 minutes)

### Step 11: Visit Your App

Open browser and go to: **https://todos.charlieold.com**

🎉 **It should load!**

**Test:**
- ✅ Register a new account
- ✅ Create a todo
- ✅ Complete a todo
- ✅ Try dark mode
- ✅ Test on mobile

### Step 12: Check Everything is Working

```bash
# View backend logs
docker-compose -f docker-compose.prod.yml logs backend

# View frontend logs
docker-compose -f docker-compose.prod.yml logs frontend

# View database logs
docker-compose -f docker-compose.prod.yml logs mongodb

# Check status
docker-compose -f docker-compose.prod.yml ps
```

---

## Useful Commands (Save These!)

### Viewing Logs
```bash
# Follow all logs in real-time
docker-compose -f docker-compose.prod.yml logs -f

# Just backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Restarting Services
```bash
# Restart everything
docker-compose -f docker-compose.prod.yml restart

# Restart just backend
docker-compose -f docker-compose.prod.yml restart backend
```

### Updating Your App
```bash
cd /opt/smart-todo-app

# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml up -d --build

# View logs to check deployment
docker-compose -f docker-compose.prod.yml logs -f
```

### Stopping Everything
```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Stop and remove all data (careful!)
docker-compose -f docker-compose.prod.yml down -v
```

### Checking Resource Usage
```bash
# Check disk space
df -h

# Check memory
free -h

# Check running containers
docker ps

# Check Docker disk usage
docker system df
```

---

## Troubleshooting

### Can't connect to server?
```bash
# Check if SSH is running
systemctl status ssh

# Check firewall
ufw status
```

### App not loading?
```bash
# Check if containers are running
docker-compose -f docker-compose.prod.yml ps

# Check backend health
curl http://localhost:5000/health

# Check Nginx status
systemctl status nginx

# Check Nginx logs
tail -f /var/log/nginx/error.log
```

### Database connection issues?
```bash
# Check MongoDB is running
docker-compose -f docker-compose.prod.yml ps mongodb

# Check MongoDB logs
docker-compose -f docker-compose.prod.yml logs mongodb

# Connect to MongoDB shell
docker-compose -f docker-compose.prod.yml exec mongodb mongosh -u admin -p YOUR_PASSWORD
```

### Frontend showing connection errors?
```bash
# Check CORS settings
# Open .env.docker and verify CLIENT_URL matches your domain

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

### SSL certificate issues?
```bash
# Test SSL certificate
certbot certificates

# Renew certificate (normally automatic)
certbot renew

# Check Nginx configuration
nginx -t
```

---

## Setting Up Automatic Backups (Optional)

Create a backup script:

```bash
nano /opt/backup-mongodb.sh
```

Paste this:
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker-compose -f /opt/smart-todo-app/docker-compose.prod.yml exec -T mongodb \
  mongodump --uri="mongodb://admin:YOUR_PASSWORD@localhost:27017/smart-todo-app?authSource=admin" \
  --archive=/tmp/backup-$DATE.archive

docker cp smart-todo-mongodb-prod:/tmp/backup-$DATE.archive $BACKUP_DIR/

echo "Backup completed: $BACKUP_DIR/backup-$DATE.archive"
```

Make it executable:
```bash
chmod +x /opt/backup-mongodb.sh
```

Set up daily backups:
```bash
# Open crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * /opt/backup-mongodb.sh
```

---

## Cost Breakdown

- **Server**: $6/month (or free with $200 credit for 60 days!)
- **Domain**: You already have it!
- **SSL**: FREE (Let's Encrypt)
- **Total**: $6/month after free trial

---

## What to Put on Your Resume

```
Smart Todo App - Full-Stack MERN Application
Live: https://todos.charlieold.com
GitHub: github.com/YOUR_USERNAME/smart-todo-app

• Deployed production MERN stack application on Ubuntu VPS
• Containerized application with Docker and Docker Compose
• Configured Nginx reverse proxy with SSL/TLS (Let's Encrypt)
• Implemented MongoDB with automated daily backups
• Set up CI/CD pipeline with GitHub Actions
• Technologies: React, Node.js, MongoDB, Express, Socket.io, Docker
```

---

## Next Steps After Deployment

1. ✅ Test thoroughly on multiple devices
2. ✅ Set up monitoring (optional but good)
3. ✅ Configure automated backups
4. ✅ Add Google Analytics (optional)
5. ✅ Update your resume/portfolio
6. ✅ Share with potential employers!

---

## Getting Help

**If something goes wrong:**

1. Check the logs (commands above)
2. Google the error message
3. Check DigitalOcean community tutorials
4. Ask me! (if I'm still helping)

**Useful Resources:**
- DigitalOcean Docs: https://docs.digitalocean.com
- Docker Docs: https://docs.docker.com
- Let's Encrypt: https://letsencrypt.org

---

**You're done!** 🚀

Your app is now live at **https://todos.charlieold.com** and you can tell employers you:
- Deployed a production full-stack application
- Used Docker containerization
- Configured web servers and SSL
- Manage a live production server

**Way more impressive than "I clicked Deploy on Render"!**
