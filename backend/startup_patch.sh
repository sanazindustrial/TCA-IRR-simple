#!/bin/bash
# Azure App Service startup script
# Sync patched source from wwwroot into /app image path, then launch.

set +e

echo "=== Startup Patch: syncing patched files ==="

copy_if_exists () {
	SRC="$1"
	DST="$2"
	if [ -f "$SRC" ]; then
		cp -f "$SRC" "$DST"
		if [ $? -eq 0 ]; then
			echo "Patched: $DST"
		else
			echo "WARNING: failed to copy $SRC -> $DST"
		fi
	else
		echo "INFO: source missing, skipped: $SRC"
	fi
}

copy_if_exists /home/site/wwwroot/main.py /app/main.py
copy_if_exists /home/site/wwwroot/app/api/v1/endpoints/auth.py /app/app/api/v1/endpoints/auth.py
copy_if_exists /home/site/wwwroot/app/api/v1/endpoints/users.py /app/app/api/v1/endpoints/users.py
copy_if_exists /home/site/wwwroot/app/api/v1/endpoints/api_routes.py /app/app/api/v1/endpoints/api_routes.py
copy_if_exists /home/site/wwwroot/app/services/email_service.py /app/app/services/email_service.py

export PYTHONPATH="${PYTHONPATH}:/home/site/wwwroot:/app"

echo "=== Startup Patch complete. Launching backend ==="
exec python /app/start_production.py
