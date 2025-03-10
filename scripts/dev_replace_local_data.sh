#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Define variables
REMOTE_SERVER="focus@balder.frecar.no"
REMOTE_DUMP_PATH="./portal/docker_volumes/dumpdata/latest_data.json"
LOCAL_DUMP_PATH="latest_data.json"
CONTAINER_NAME_ON_LAPTOP="portal_dev"
SETTINGS="portal.settings.dev"
DUMP_LOCATION_ON_LAPTOP="/app/data_dump.json"
NC='\033[0m' # No Color

# Function to log messages to console
log_console() {
    local message="$1"
    local color="$2"
    [ -z "$color" ] && color=$NC
    echo -e "$color$(date '+%Y-%m-%d %H:%M:%S') - $message${NC}"
}

# Start logging
log_console "Starting the data fetch and load process from production server to local."

# Fetch the dump file from the remote production server
log_console "Fetching data dump from production server."
scp "$REMOTE_SERVER:$REMOTE_DUMP_PATH" "$LOCAL_DUMP_PATH"

# Copy the dump to the local docker container
log_console "Copying dump to the local docker container."
(docker exec -i $CONTAINER_NAME_ON_LAPTOP sh -c "cat > $DUMP_LOCATION_ON_LAPTOP") < $LOCAL_DUMP_PATH

# Flush data on local machine
log_console "Flushing data"
docker exec $CONTAINER_NAME_ON_LAPTOP python /app/manage.py flush  --no-input --settings=$SETTINGS

# Clean initial data on local machine
log_console "Clean initial data"
docker exec $CONTAINER_NAME_ON_LAPTOP python /app/manage.py clean_initial_data --settings=$SETTINGS

# Load the data on local machine
log_console "Loading data"
docker exec $CONTAINER_NAME_ON_LAPTOP python /app/manage.py loaddata $DUMP_LOCATION_ON_LAPTOP --settings=$SETTINGS

# Remove the data dump from local container
log_console "Removing data dump from local container."
docker exec $CONTAINER_NAME_ON_LAPTOP rm $DUMP_LOCATION_ON_LAPTOP

# Remove local dump file
rm "$LOCAL_DUMP_PATH"

# Completed
log_console "Data fetch and load process completed."
