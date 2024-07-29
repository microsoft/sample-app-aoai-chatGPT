#!/usr/bin/env bash

# Cleaning up previous installations if any
rm -rf ~/.nvm
rm -rf ~/.npm
rm -rf ~/.node-gyp
rm -rf ~/.node_repl_history
rm -rf ~/.nvmrc

# Set the Python interpreter to use
PYTHON_BIN=python3

# Check if the Python interpreter is available
if ! command -v $PYTHON_BIN &> /dev/null; then
  echo "$PYTHON_BIN could not be found"
  exit 1
fi

# Install Rust compiler if needed
if ! command -v rustc &> /dev/null; then
  echo "Installing Rust compiler..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
  . "$HOME/.cargo/env"
fi

# Upgrade pip and install dependencies
echo "Upgrading pip and installing dependencies..."
$PYTHON_BIN -m pip install --upgrade pip
$PYTHON_BIN -m pip install -r requirements.txt

# Install Node.js directly if not available
if ! command -v node &> /dev/null; then
  echo "Node.js not found, installing Node.js"
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install 18
  nvm use 18
fi

# Ensure Node.js version is set correctly
export PATH=$NVM_DIR/versions/node/v18.*/bin:$PATH

# Ensure frontend directory exists and restore npm packages
if [ -d "frontend" ]; then
  echo "Restoring npm packages in frontend directory..."
  cd frontend
  npm install
  if [ $? -ne 0 ]; then
    echo "Failed to restore frontend npm packages. See above for logs."
  fi
  cd ..
else
  echo "Frontend directory not found"
fi

# Ensure the application directory exists and change to it
cd /home/site/wwwroot || exit
