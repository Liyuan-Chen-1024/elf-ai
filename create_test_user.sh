#!/bin/bash

# Check if the test user already exists
echo "Checking if test user exists..."
if python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); print(User.objects.filter(username='admin').exists())" | grep -q "True"; then
    echo "Test user already exists."
    exit 0
fi

# Create the test user
echo "Creating test user..."
python manage.py create_test_user 