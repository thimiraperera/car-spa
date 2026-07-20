#!/bin/bash
# Pulls the latest backend branch, installs dependencies and restarts
# Passenger. Fully self-contained: run it by hand, from cron, or via
# cPanel's Git "Deploy" button (.cpanel.yml calls this same script).
set -e

APP_PATH="/home/compopkz/repositories/carspa"
NODEVENV="/home/compopkz/nodevenv/repositories/carspa/24/bin/activate"
BRANCH="backend"

cd "$APP_PATH"

# reset --hard only touches tracked files, so .env, node_modules and
# media/uploads (all untracked) are never affected by this.
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

source "$NODEVENV"
npm ci --omit=dev
deactivate

mkdir -p "$APP_PATH/tmp"
touch "$APP_PATH/tmp/restart.txt"

echo "Deployed $(date)"
