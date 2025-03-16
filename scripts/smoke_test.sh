#!/bin/bash
set -e

# Get environment from args
ENV=${1:-prod}
BASE_URL=${2:-"https://api.elfai-media.com"}

if [ "$ENV" = "staging" ]; then
  BASE_URL="https://api-staging.elfai-media.com"
fi

echo "Running smoke tests against $BASE_URL..."

# Health check
echo "Testing health endpoint..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health/")
if [ "$HEALTH_STATUS" -ne 200 ]; then
  echo "Health check failed with status $HEALTH_STATUS"
  exit 1
fi
echo "Health check passed"

# API version check
echo "Testing API version..."
VERSION_CHECK=$(curl -s "$BASE_URL/api/v1/version" | grep -q "1.0.0")
if [ $? -ne 0 ]; then
  echo "Version check failed"
  exit 1
fi
echo "Version check passed"

# Media API check
echo "Testing media API..."
MEDIA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/media/files")
if [ "$MEDIA_STATUS" -ne 200 ]; then
  echo "Media API check failed with status $MEDIA_STATUS"
  exit 1
fi
echo "Media API check passed"

echo "All smoke tests passed!"
exit 0
