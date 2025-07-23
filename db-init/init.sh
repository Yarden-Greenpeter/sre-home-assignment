# Wait for TiDB to be ready
echo "Waiting for TiDB to be ready..."
until mysql -h $TIDB_HOST -P $TIDB_PORT -u $TIDB_USER -e "SELECT 1" > /dev/null 2>&1; do
    echo "TiDB is not ready yet, waiting..."
    sleep 2
done

echo "TiDB is ready! Initializing database..."

# Execute SQL file
mysql -h $TIDB_HOST -P $TIDB_PORT -u $TIDB_USER < /docker-entrypoint-initdb.d/init.sql

if [ $? -eq 0 ]; then
    echo "Database initialization completed successfully!"
else
    echo "Database initialization failed!"
    exit 1
fi