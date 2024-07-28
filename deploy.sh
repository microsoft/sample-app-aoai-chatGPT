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

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

./start.sh

# Restart services if necessary
# service apache2 restart
