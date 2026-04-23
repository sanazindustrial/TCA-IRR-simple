#!/bin/bash
# Azure App Service startup script
# Delegates to Python production startup script
set -e

cd /home/site/wwwroot

# Ensure Python path includes current dir
export PYTHONPATH="${PYTHONPATH}:/home/site/wwwroot"

echo "[startup] Starting TCA IRR backend..."
exec python start_production.py
