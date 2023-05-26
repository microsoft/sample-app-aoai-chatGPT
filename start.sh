#!/bin/sh

echo ""
echo "Restoring backend python packages"
echo ""

python -m pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Failed to restore backend python packages"
    exit $?
fi

cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "Failed to restore frontend npm packages"
    exit $?
fi)

echo ""
echo "Building frontend"
echo ""

npm run build
if [ $? -ne 0 ]; then
    echo "Failed to build frontend"
    exit $?
fi


echo ""
echo "Starting backend"
echo ""

cd ../backend
python ./app.py
if [ $? -ne 0 ]; then
    echo "Failed to start backend"
    exit $?
fi
