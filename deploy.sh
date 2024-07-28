#!/bin/bash

# Ensure pip is up to date
python3 -m ensurepip --upgrade

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Navigate back to the root directory if needed
cd ..

# Restart services if necessary
# service apache2 restart
