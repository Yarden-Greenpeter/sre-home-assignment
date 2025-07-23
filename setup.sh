echo "SRE Assignment - Starting Setup..."
echo "======================================"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo " Docker not found. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo " Docker Compose not found. Please install Docker Compose first."
    exit 1
fi

echo " Docker is ready"

# Create .env if missing
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
TIDB_HOST=tidb
TIDB_PORT=4000
TIDB_USER=root
TIDB_PASSWORD=
TIDB_DATABASE=sre_assignment
JWT_SECRET=sre-assignment-secret-key
KAFKA_BROKERS=kafka:9092
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://localhost:3001
EOF
    echo "✅ Created .env file"
fi

# Clean up
echo "🧹 Cleaning up previous containers..."
docker-compose down -v --remove-orphans 2>/dev/null || true

# Start services
echo "🔨 Building and starting all services..."
echo "This will take a few minutes..."

if docker-compose up --build -d; then
    echo ""
    echo " SUCCESS! All services are running"
    echo ""
    echo " Frontend: http://localhost:3001"
    echo " Backend:  http://localhost:3000"
    echo ""
    echo " Test Login:"
    echo "   Email: admin@example.com"
    echo "   Password: Admin123!"
    echo ""
    echo " View logs: docker-compose logs -f"
    echo " Stop: docker-compose down"
    echo ""
    echo ""
    echo " Setup failed. Check logs with: docker-compose logs"
    exit 1
fi
