# Only load env from azd if azd command and azd environment exist
if not command -v azd &> /dev/null; then
    echo "azd command not found, skipping .env file load"
else
    if [ -z "$(azd env list | grep -w true | awk '{print $1}')" ]; then
        echo "No azd environments found, skipping .env file load"
    else
        echo "Loading azd .env file from current environment"
        while IFS='=' read -r key value; do
        value=$(echo "$value" | sed 's/^"//' | sed 's/"$//')
        export "$key=$value"
        done <<EOF
$(azd env get-values --no-prompt)
EOF
    fi
fi


echo 'Creating Python virtual environment ".venv" in root'
python3 -m venv .venv

echo 'Installing dependencies from "requirements.txt" into virtual environment'
./.venv/bin/python -m pip install -r requirements-dev.txt
