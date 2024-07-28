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

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
  apt-get install -y nodejs
fi

# Restore frontend npm packages
cd frontend
npm install
cd ..

# Change to the directory where start.sh is located
cd /home/site/wwwroot || exit

# Ensure start.sh has execute permissions
chmod +x start.sh

# Start the application using the start.sh script
./start.sh
