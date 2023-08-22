#!/bin/bash
cd frontend
echo ""
echo "Starting frontend in debug mode"
echo ""
npm run dev
if [ $? -ne 0 ]; then
    echo "Failed to start frontend in debug mode"
    exit $?
fi