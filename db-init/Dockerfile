FROM mysql:8.0

WORKDIR /app

# Copy initialization scripts
COPY init.sql /docker-entrypoint-initdb.d/
COPY init.sh /app/

# Make script executable
RUN chmod +x /app/init.sh

CMD ["/app/init.sh"]