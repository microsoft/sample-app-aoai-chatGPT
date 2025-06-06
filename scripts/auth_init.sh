 #!/bin/sh

. ./scripts/loadenv.sh

echo 'Running "auth_init.py"'
./.venv/bin/python ./scripts/auth_init.py --appid "$AUTH_APP_ID"
