#!/usr/bin/env bash

# Cleaning up previous installations if any
rm -rf venv
rm -rf ~/.nvm
rm -rf ~/.npm
rm -rf ~/.node-gyp
rm -rf ~/.node_repl_history
rm -rf ~/.nvmrc

# Set the Python interpreter to use
PYTHON_BIN=python3.11

# Check if the Python interpreter is available
if ! command -v $PYTHON_BIN &> /dev/null; then
  echo "$PYTHON_BIN could not be found"
  exit 1
fi

# Creating the virtual environment
echo "Creating virtual environment using $PYTHON_BIN..."
$PYTHON_BIN -m venv venv
if [ $? -ne 0 ]; then
  echo "Failed to create virtual environment"
  exit 1
fi

# Activate the virtual environment
echo "Activating virtual environment..."
if [ -f "venv/bin/activate" ]; then
  source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
  source venv/Scripts/activate
else
  echo "Error: venv activation script not found."
  exit 1
fi

# Ensure pip is in the PATH
export PATH=$PATH:/home/.local/bin:/home/site/wwwroot/venv/bin

# Check if the virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
  echo "Virtual environment is not activated."
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
pip install --upgrade pip
pip install -r requirements.txt

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
export PATH=$NVM_DIR/versions/node/v18.*/bin
