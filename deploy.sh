#!/usr/bin/env bash

# Ensure the venv directory does not exist to start fresh
if [ -d "venv" ]; then
  echo "Removing existing virtual environment..."
  rm -rf venv
fi

# Ensure the venv directory exists and create it if it doesn't
echo "Creating virtual environment using python3..."
python3 -m venv venv
if [ $? -ne 0 ]; then
  echo "Failed to create virtual environment"
  exit 1
fi

# Ensure pip is in the PATH
export PATH=$PATH:/home/.local/bin:/home/site/wwwroot/venv/bin

# Activate the virtual environment
echo "Activating virtual environment..."
if [ -f "venv/bin/activate" ]; then
  echo "Activating from venv/bin/activate"
  source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
  echo "Activating from venv/Scripts/activate"
  source venv/Scripts/activate
else
  echo "Error: venv activation script not found. Listing directory contents for debugging:"
  ls -al venv
  echo "Listing contents of venv/bin directory:"
  ls -al venv/bin
  exit 1
fi

# Check if the virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
  echo "Virtual environment is not activated."
  exit 1
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
