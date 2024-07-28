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

# Debugging: Print Cargo path
echo "Cargo path: $PATH"

# Activate the virtual environment
source venv/scripts/activate

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
  apt-get install -y nodejs
fi

# Debugging: Print Node.js version
node -v

# Restore frontend npm packages
cd frontend
npm install
cd ..

# Debugging: Print current directory and list files
echo "Current directory: $(pwd)"
echo "Listing files:"
ls -la

# Copy start.sh to the correct directory
cp start.sh /home/site/wwwroot/

# Change to the directory where start.sh is located
cd /home/site/wwwroot || exit

# Debugging: Print current directory and list files again
echo "Current directory after cd: $(pwd)"
echo "Listing files after cd:"
ls -la

# Ensure start.sh has execute permissions
chmod +x start.sh

# Debugging: Verify start.sh permissions
ls -la start.sh

# Start the application using the start.sh script
./start.sh
