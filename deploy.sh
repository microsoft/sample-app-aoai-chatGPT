#!/usr/bin/env bash

# Extract the virtual environment
echo "Extracting virtual environment..."
tar -xzf venv.tar.gz

# Ensure pip is in the PATH
export PATH=$PATH:/home/.local/bin:/home/site/wwwroot/venv/Scripts

# Activate the virtual environment
echo "Activating virtual environment..."
if [ -f "venv/Scripts/activate" ]; then
  source venv/Scripts/activate
else
  echo "Error: venv activation script not found."
  exit 1
fi

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

echo "Setup complete. The application will be started by Azure Web App settings."
