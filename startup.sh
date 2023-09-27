#!/bin/bash

echo ""
echo "Installing requirements"
echo ""
cd streamlit
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Failed to install required packages"
    exit $?
fi

echo ""
echo "Launching streamlit"
echo ""
streamlit run chat.py --server.port 8000
if [ $? -ne 0 ]; then
    echo "Failed to launch streamlit"
    exit $?
fi