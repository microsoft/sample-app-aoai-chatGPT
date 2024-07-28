#!/bin/bash

# Navigate to the backend directory if it's separate
cd backend  # Adjust this if your requirements.txt is in the root

# Ensure pip is up to date
python -m ensurepip --upgrade

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Navigate back to the root directory if needed
cd ..

# Restart services if necessary
# service apache2 restart
