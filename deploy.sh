#!/usr/bin/env bash

# Remove any existing virtual environment
echo "Removing existing virtual environment..."
rm -rf venv

# Create a virtual environment using the Python 3.9 interpreter
echo "Creating virtual environment using python3..."
python3 -m venv venv

if [ ! -d "venv" ]; then
  echo "Failed to create virtual environment"
  exit 1
fi

# Activate the virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Ensure pip is in the PATH
export PATH=$PATH:/home/.local/bin:/home/site/wwwroot/venv/bin

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

# Clear npm cache to avoid potential issues
echo "Clearing npm cache..."
npm cache clean --force

# Ensure frontend directory exists and restore npm packages
if [ -d "frontend" ]; then
  echo "Restoring npm packages in frontend directory..."
  cd frontend
  npm install
  if [ $? -ne 0 ]; then
    echo "Failed to restore frontend npm packages. See above for logs."
    cat /home/.npm/_logs/$(date +%Y-%m-%dT%H_%M_%S_%3NZ)-debug.log
  fi
  cd ..
else
  echo "Frontend directory not found"
fi

# Ensure the application directory exists and change to it
cd /home/site/wwwroot || exit

echo "Deployment completed successfully."
