#!/bin/bash
# Syncs the git working copy into the live Node app root, installs
# dependencies and restarts Passenger. Run this by hand after a git pull,
# or let .cpanel.yml trigger it automatically from cPanel's Git UI.
set -e

REPO_PATH="/home/compcfcd/carspa"
APP_PATH="/home/compcfcd/repositories/carspa"

# cPanel names this folder after the Node.js major version (24, not
# 24.15.0). If this script fails on the source line below, open Setup
# Node.js App, copy the "Enter to virtual environment" path shown there
# and use it here instead.
NODEVENV="/home/compcfcd/nodevenv/repositories/carspa/24/bin/activate"

mkdir -p "$APP_PATH"

# .env, node_modules and admin-uploaded media must survive every deploy,
# so they are left alone in the destination rather than synced from git.
rsync -a --delete \
  --exclude='.git/' \
  --exclude='.env' \
  --exclude='node_modules/' \
  --exclude='media/uploads/' \
  "$REPO_PATH/" "$APP_PATH/"

source "$NODEVENV"
cd "$APP_PATH"
npm ci --omit=dev
deactivate

mkdir -p "$APP_PATH/tmp"
touch "$APP_PATH/tmp/restart.txt"

echo "Deployed $(date)"
