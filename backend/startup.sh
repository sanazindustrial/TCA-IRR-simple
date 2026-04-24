#!/bin/bash
# Azure App Service startup script
set -e

cd /home/site/wwwroot

export PYTHONPATH="${PYTHONPATH}:/home/site/wwwroot"

echo "[startup] Starting TCA IRR backend..."
exec python start_production.py
