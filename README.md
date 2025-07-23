# SRE Home Assignment - Full Stack Application

A complete full-stack application with authentication, database integration, and monitoring capabilities built with Node.js, React, TiDB, and Apache Kafka.

## 🚀 Quick Start

### Prerequisites
- Docker
- Docker Compose

### Run the Application

**Option 1: Setup Script (Recommended)**
```bash
chmod +x setup.sh
./setup.sh
```

**Option 2: Docker Compose**
```bash
docker-compose up --build
```

That's it! The entire application will be running.

## 🌐 Access the Application

After startup, access:
- **Frontend (Login Page)**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 🔐 Test Credentials

| Email | Password |
|-------|----------|
| `admin@example.com` | `Admin123!` |
| `test@example.com` | `Test123!` |

## 🏗️ Architecture

- **Frontend**: React app with login interface
- **Backend**: Node.js API with JWT authentication
- **Database**: TiDB with auto-initialization
- **Message Queue**: Apache Kafka for real-time processing
- **Monitoring**: JSON logging with log4js and CDC

## 🧪 Testing

1. **Login Test**: Go to http://localhost:3001 and login with test credentials
2. **API Test**: 
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"Admin123!"}'
   ```
3. **Logs Test**: 
   ```bash
   docker-compose logs backend | grep "login_success"
   ```

## 🛠️ Common Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Clean rebuild
docker-compose down -v && docker-compose up --build
```

## 📋 Features Implemented

### ✅ Part 1: Simple Development
- Node.js backend with RESTful API
- React frontend with authentication
- TiDB database integration
- JWT token management

### ✅ Part 2: DevOps Implementation
- Docker containers for all services
- TiDB configured in Docker
- Apache Kafka message broker
- Automatic database initialization

### ✅ Part 3: Monitoring & Logging
- User activity logging in JSON format with log4js
- Database change monitoring with CDC
- Real-time data processing with Kafka consumer
- Structured logging throughout

## 🐛 Troubleshooting

**Containers not starting?**
```bash
docker-compose down -v
docker-compose up --build
```

**Port conflicts?**
```bash
# Check what's using the ports
lsof -i :3000 -i :3001 -i :4000 -i :9092
```

**View service logs:**
```bash
docker-compose logs [service-name]
# Example: docker-compose logs backend
```

---

**🎯 Ready to run!** Execute `./setup.sh` or `docker-compose up --build` to get started.