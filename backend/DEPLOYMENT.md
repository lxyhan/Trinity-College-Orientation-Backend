# Deployment Guide

This guide covers deploying the Trinity College Orientation Leaders API to various environments.

## Local Development

### Prerequisites
- Python 3.8+
- pip or conda

### Setup
1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Trinity-College-Orientation-Backend
   ```

2. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Run the server:**
   ```bash
   python main.py
   ```

4. **Access the API:**
   - API: http://localhost:8000
   - Interactive docs: http://localhost:8000/docs

## Production Deployment

### Option 1: Docker Deployment

1. **Create Dockerfile:**
   ```dockerfile
   FROM python:3.9-slim
   
   WORKDIR /app
   
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   
   COPY . .
   
   EXPOSE 8000
   
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

2. **Build and run:**
   ```bash
   docker build -t orientation-api .
   docker run -p 8000:8000 orientation-api
   ```

### Option 2: Systemd Service (Linux)

1. **Create service file:**
   ```bash
   sudo nano /etc/systemd/system/orientation-api.service
   ```

2. **Add service configuration:**
   ```ini
   [Unit]
   Description=Trinity College Orientation Leaders API
   After=network.target
   
   [Service]
   Type=simple
   User=www-data
   WorkingDirectory=/path/to/backend
   Environment=PATH=/path/to/backend/venv/bin
   ExecStart=/path/to/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable and start service:**
   ```bash
   sudo systemctl enable orientation-api
   sudo systemctl start orientation-api
   sudo systemctl status orientation-api
   ```

### Option 3: Cloud Deployment

#### Heroku
1. **Create Procfile:**
   ```
   web: uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

2. **Deploy:**
   ```bash
   heroku create your-app-name
   git push heroku main
   ```

#### AWS EC2
1. **Launch EC2 instance**
2. **Install dependencies:**
   ```bash
   sudo apt update
   sudo apt install python3-pip python3-venv nginx
   ```

3. **Setup application:**
   ```bash
   cd /var/www
   sudo git clone <repository-url> orientation-api
   cd orientation-api/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Configure Nginx:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
   
       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

5. **Run with Gunicorn:**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 127.0.0.1:8000
   ```

## Environment Configuration

### Environment Variables
Create a `.env` file for configuration:
```bash
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:3000

# Data Paths
DATA_DIR=../data
```

### Update main.py to use environment variables:
```python
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Trinity College Orientation Leaders API",
    description="API for serving orientation leader assignments, event staffing, and summary data",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Security Considerations

### Production Security
1. **Restrict CORS origins** to your frontend domain
2. **Add rate limiting:**
   ```python
   from slowapi import Limiter, _rate_limit_exceeded_handler
   from slowapi.util import get_remote_address
   from slowapi.errors import RateLimitExceeded
   
   limiter = Limiter(key_func=get_remote_address)
   app.state.limiter = limiter
   app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
   ```

3. **Add authentication if needed:**
   ```python
   from fastapi.security import HTTPBearer
   
   security = HTTPBearer()
   
   @app.get("/protected")
   async def protected_endpoint(token: str = Depends(security)):
       # Verify token
       pass
   ```

### SSL/TLS
1. **Use HTTPS in production**
2. **Configure SSL certificates** (Let's Encrypt, etc.)
3. **Redirect HTTP to HTTPS**

## Monitoring and Logging

### Logging Configuration
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("api.log"),
        logging.StreamHandler()
    ]
)
```

### Health Checks
The API includes a health endpoint at `/health` for monitoring:
```bash
curl http://your-api.com/health
```

### Performance Monitoring
Consider adding:
- Prometheus metrics
- Application Performance Monitoring (APM)
- Database query monitoring

## Backup and Recovery

### Data Backup
1. **Backup CSV files regularly**
2. **Version control data changes**
3. **Database backup if migrating from CSV**

### Application Backup
1. **Backup application code**
2. **Backup configuration files**
3. **Document deployment procedures**

## Troubleshooting

### Common Issues
1. **Port already in use:**
   ```bash
   lsof -i :8000
   kill -9 <PID>
   ```

2. **Permission denied:**
   ```bash
   chmod +x start.sh
   sudo chown -R $USER:$USER /path/to/backend
   ```

3. **Data not loading:**
   - Check file paths
   - Verify CSV file permissions
   - Check file encoding

### Logs
- Check application logs: `tail -f api.log`
- Check system logs: `journalctl -u orientation-api`
- Check nginx logs: `tail -f /var/log/nginx/error.log`

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (Nginx, HAProxy)
- Multiple application instances
- Shared data storage

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Use caching (Redis, Memcached)

### Performance Optimization
- Async operations
- Database indexing
- Response compression
- CDN for static assets

## Support

For deployment issues:
1. Check logs and error messages
2. Verify configuration
3. Test endpoints individually
4. Check system resources
5. Review security settings
