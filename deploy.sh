#!/usr/bin/env bash

# Ensure the venv directory exists and create it if it doesn't
if [ ! -d "venv" ]; then
  python3.12 -m venv venv
fi

# Ensure pip is in the PATH
export PATH=$PATH:/home/.local/bin:/home/site/wwwroot/venv/bin

# Install Rust compiler if needed
if ! command -v rustc &> /dev/null; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  . "$HOME/.cargo/env"
fi

# Activate the virtual environment
source venv/bin/activate

# Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Remove any existing Node.js installation
rm -rf ~/.nvm ~/.npm ~/.node-gyp ~/.node_repl_history ~/.nvmrc

# Install Node.js directly if not available
if ! command -v node &> /dev/null; then
  echo "Node.js not found, installing Node.js"
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install 18
  nvm use 18
fi

# Debugging: Print Node.js version
node -v

# Ensure frontend directory exists and restore npm packages
if [ -d "frontend" ]; then
  cd frontend
  npm install
  if [ $? -ne 0 ]; then
    echo "Failed to restore frontend npm packages. Here are the logs:"
    cat npm_install.log
  fi
  cd ..
else
  echo "Frontend directory not found"
fi

# Copy start.sh to the correct directory and change to it
cp start.sh /home/site/wwwroot/
cd /home/site/wwwroot || exit
chmod +x start.sh

# Start the application using the start.sh script
./start.sh
