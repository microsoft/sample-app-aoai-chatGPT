#!/bin/bash

echo ""
echo "Restoring frontend npm packages"
echo ""
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "Failed to restore frontend npm packages"
    exit $?
fi

echo ""
echo "Building frontend"
echo ""
npm run build
if [ $? -ne 0 ]; then
    echo "Failed to build frontend"
    exit $?
fi

echo ""
echo "Starting backend"
echo ""
cd ..
python3 -m flask run --port=5000 --host=127.0.0.1 --reload --debug
if [ $? -ne 0 ]; then
    echo "Failed to start backend"
    exit $?
fi
