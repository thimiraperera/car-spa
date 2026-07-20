#!/bin/bash
# Installs dependencies and restarts Passenger after a git pull. The git
# repository path and the live Node app root are the same directory in
# this setup, so there is nothing to sync, just reinstall and reload.
set -e

APP_PATH="/home/compopkz/repositories/carspa"
NODEVENV="/home/compopkz/nodevenv/repositories/carspa/24/bin/activate"

cd "$APP_PATH"
source "$NODEVENV"
npm ci --omit=dev
deactivate

mkdir -p "$APP_PATH/tmp"
touch "$APP_PATH/tmp/restart.txt"

echo "Deployed $(date)"
