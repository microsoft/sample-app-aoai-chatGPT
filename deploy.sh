#!/usr/bin/env bash

# Unpack the pre-built virtual environment
#tar -xzf venv.tar.gz

# Ensure the venv directory exists and contains the expected files
if [ ! -d "venv" ]; then
   python3.12 -m venv venv
fi

export PATH=$PATH:/home/.local/bin:/home/site/wwwroot/venv/bin


# Install Rust compiler if needed
if ! command -v rustc &> /dev/null
then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
fi

# Activate the virtual environment
source venv/scripts/activate

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

./start.sh

# Restart services if necessary
# service apache2 restart
