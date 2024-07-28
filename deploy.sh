#!/usr/bin/env bash

# Update the package list and install python3-venv
sudo apt-get update
sudo apt-get install -y python3-venv

# Check if python3 is available
if ! command -v python3 &> /dev/null
then
    echo "Python3 could not be found"
    exit 1
fi

# Ensure pip is available
if ! command -v pip &> /dev/null
then
    curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
    python3 get-pip.py
    rm get-pip.py
fi

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Restart services if necessary
# service apache2 restart
