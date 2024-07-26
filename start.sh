#!/bin/bash -e

# script usage info
function usage() {
    cat <<USAGE

    Usage: $0 [-s|--skip-build]

    Options:
        -s, --skip-build:              Optional.
USAGE
    exit 1
}

function build() {
    echo "Building the application.  To skip this step in the future, use the `--skip-build` option."
    echo ""
    echo "Restoring frontend npm packages"
    echo ""
    cd frontend
    npm install
    if [ $? -ne 0 ]; then
        echo "Failed to restore frontend npm packages"
        exit $?
    fi

    echo ""
    echo "Building frontend"
    echo ""
    npm run build
    if [ $? -ne 0 ]; then
        echo "Failed to build frontend"
        exit $?
    fi
    cd ..

    echo ""
    echo "Restoring backend python packages"
    . ./scripts/loadenv.sh
}

function run() {
    echo ""
    echo "Starting backend"
    echo ""
    ./.venv/bin/python -m quart run --port=50505 --host=127.0.0.1 --reload
    if [ $? -ne 0 ]; then
        echo "Failed to start backend"
        exit $?
    fi
}

SKIP_BUILD=0
while [ "$1" != "" ]; do
    case $1 in
    -s | --skip-build)
        SKIP_BUILD=1
        ;;
    *)
        usage
        exit 1
        ;;
    esac
    shift
done

export NODE_OPTIONS=--max_old_space_size=8192

if [[ $SKIP_BUILD == 0 ]]; then
    build
fi

run



