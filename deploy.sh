#!/usr/bin/env bash

# Check if python3 is available
if ! command -v python3 &> /dev/null
then
    echo "Python3 could not be found"
    exit 1
fi

# Check if python3-venv is available
if ! python3 -m venv &> /dev/null
then
    echo "Installing python3-venv"
    apt-get update
    apt-get install -y python3-venv
fi

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Ensure pip is available
if ! command -v pip &> /dev/null
then
    echo "Installing pip"
    curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
    python3 get-pip.py
    rm get-pip.py
fi

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Restart services if necessary
# service apache2 restart
