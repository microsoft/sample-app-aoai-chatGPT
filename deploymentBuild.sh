#!/bin/bash

# Update package list and install npm
echo ""
echo "Running apt-get update"
echo ""
apt-get update && apt-get install -y npm
if [ $? -ne 0 ]; then
    echo "Failed to install npm"
    exit $?
fi

# Restore and build frontend using npm
echo ""
echo "Restoring and building frontend"
echo ""
cd frontend && npm install && npm run build
if [ $? -ne 0 ]; then
    echo "Failed to restore and build frontend"
    exit $?
fi

exit 0