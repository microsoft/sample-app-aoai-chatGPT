#!/bin/bash

# 1. Install dependencies explicitly on the server
echo "Installing dependencies from requirements.txt..."
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# 2. Start the Gunicorn server with Uvicorn workers
echo "Starting Gunicorn..."
gunicorn -w 2 -k uvicorn.workers.UvicornWorker app:app
