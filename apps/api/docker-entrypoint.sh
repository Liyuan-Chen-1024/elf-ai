#!/bin/sh

# Wait for database to be ready
echo "Waiting for database..."
max_retries=30
counter=0
while ! python -c "import MySQLdb; MySQLdb.connect(host='db', user='elfai', passwd='elfai', db='elfai')" 2>/dev/null; do
    counter=$((counter+1))
    if [ $counter -gt $max_retries ]; then
        echo "Database connection failed after $max_retries attempts. Exiting."
        exit 1
    fi
    echo "Waiting for database connection... ($counter/$max_retries)"
    sleep 2
done
echo "Database is ready."

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Create test user in development
echo "Creating test user..."
python manage.py create_test_user

# Execute the main command (usually runserver)
exec "$@"
