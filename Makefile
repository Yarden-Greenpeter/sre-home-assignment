.PHONY: build up down logs clean test

# Build all services
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Clean everything
clean:
	docker-compose down -v --rmi all

# Run tests
test:
	docker-compose exec backend npm test

# Initialize database manually
init-db:
	docker-compose up db-init

# Restart backend
restart-backend:
	docker-compose restart backend

# Check service status
status:
	docker-compose ps

# Access backend shell
backend-shell:
	docker-compose exec backend sh

# Access TiDB
tidb-shell:
	docker-compose exec tidb mysql -h 127.0.0.1 -P 4000 -u root