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

# Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Install Node.js directly if not available
if ! command -v node &> /dev/null; then
  echo "Node.js not found, installing Node.js"
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install 18
fi

# Debugging: Print Node.js version
node -v

# Ensure frontend directory exists and restore npm packages
if [ -d "frontend" ]; then
  echo "Current directory: $(pwd)"
  echo "Listing files in frontend directory:"
  ls -la frontend
  cd frontend
  echo "Restoring npm packages in frontend directory..."
  npm install > npm_install.log 2>&1
  if [ $? -ne 0 ]; then
    echo "Failed to restore frontend npm packages. Here are the logs:"
    cat npm_install.log
  else
    echo "NPM packages restored successfully."
  fi
  cd ..
else
  echo "Frontend directory not found"
fi

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
