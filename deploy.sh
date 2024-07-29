#!/usr/bin/env bash

# Cleanup any previous installations
echo "Cleaning up previous installations..."
rm -rf venv

# Install pip locally if not available
if ! command -v pip &> /dev/null; then
  echo "Installing pip..."
  curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
  python3 get-pip.py --user
  rm get-pip.py
fi

# Ensure pip is in the PATH
export PATH=$HOME/.local/bin:$PATH

# Install dependencies directly without virtual environment
echo "Installing dependencies..."
pip install --upgrade pip --user
pip install -r requirements.txt --user

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

# Run the application using the startup command configured in Azure Web App settings
