#!/bin/bash

echo "Installing npm"
apt-get update
apt-get install -y npm
if [ $? -ne 0 ]; then
    echo "Failed to install npm"
    exit $?
fi

echo "Installing yarn"
npm install -g yarn
if [ $? -ne 0 ]; then
    echo "Failed to install yarn"
    exit $?
fi

echo "Installing pip"
apt-get install -y python3-pip
if [ $? -ne 0 ]; then
    echo "Failed to install pip"
    exit $?
fi

# echo "Installing Python dependencies"
# pip3 install -r requirements.txt
# if [ $? -ne 0 ]; then
#     echo "Failed to install Python dependencies"
#     exit $?
# fi

# echo "Restoring frontend npm packages"
# cd frontend
# yarn install
# if [ $? -ne 0 ]; then
#     echo "Failed to restore frontend npm packages"
#     exit $?
# fi

echo ""
echo "Building frontend"
echo ""
npm run build
if [ $? -ne 0 ]; then
    echo "Failed to build frontend"
    exit $?
fi

cd ..

# echo "Loading environment variables"
# . ./scripts/loadenv.sh

# echo "Starting backend"
# ./.venv/bin/python -m flask run --port=5000 --host=127.0.0.1 --reload --debug
# if [ $? -ne 0 ]; then
#     echo "Failed to start backend"
#     exit $?
# fi



# echo ""
# echo "Restoring frontend npm packages"
# echo ""
# cd frontend
# npm install
# if [ $? -ne 0 ]; then
#     echo "Failed to restore frontend npm packages"
#     exit $?
# fi

# echo ""
# echo "Building frontend"
# echo ""
# npm run build
# if [ $? -ne 0 ]; then
#     echo "Failed to build frontend"
#     exit $?
# fi

# cd ..
# . ./scripts/loadenv.sh

# echo ""
# echo "Starting backend"
# echo ""
# ./.venv/bin/python -m flask run --port=5000 --host=127.0.0.1 --reload --debug
# if [ $? -ne 0 ]; then
#     echo "Failed to start backend"
#     exit $?
# fi
