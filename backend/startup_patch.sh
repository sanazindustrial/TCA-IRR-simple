#!/bin/bash
# Patch specific files in /app/ from wwwroot fixes, then run the original entrypoint.
# /app/ is owned by appuser so writes are allowed.
echo "=== Startup: Patching /app/ from wwwroot fixes ==="

WWWROOT="/home/site/wwwroot"

# Patch cost.py (fixes _table_exists for company_analyses)
COST_SRC="$WWWROOT/app/api/v1/endpoints/cost.py"
COST_DST="/app/app/api/v1/endpoints/cost.py"
if [ -f "$COST_SRC" ]; then
    cp -f "$COST_SRC" "$COST_DST" 2>/dev/null \
        && echo "Patched: cost.py OK" \
        || echo "WARN: could not patch cost.py (may be read-only)"
else
    echo "WARN: cost.py not found in wwwroot, skipping patch"
fi

# Patch main.py (enables /docs via ENABLE_SWAGGER_DOCS env var)
MAIN_SRC="$WWWROOT/main.py"
MAIN_DST="/app/main.py"
if [ -f "$MAIN_SRC" ]; then
    cp -f "$MAIN_SRC" "$MAIN_DST" 2>/dev/null \
        && echo "Patched: main.py OK" \
        || echo "WARN: could not patch main.py (may be read-only)"
else
    echo "WARN: main.py not found in wwwroot, skipping patch"
fi

# Patch api_routes.py (fixes invalid 's"""' string prefix syntax error on line 1)
API_ROUTES_SRC="$WWWROOT/app/api/v1/endpoints/api_routes.py"
API_ROUTES_DST="/app/app/api/v1/endpoints/api_routes.py"
if [ -f "$API_ROUTES_SRC" ]; then
    cp -f "$API_ROUTES_SRC" "$API_ROUTES_DST" 2>/dev/null \
        && echo "Patched: api_routes.py OK" \
        || echo "WARN: could not patch api_routes.py (may be read-only)"
else
    echo "WARN: api_routes.py not found in wwwroot, skipping patch"
fi

# Run original entrypoint from /app/ (known-good, all dependencies present)
PYTHON_BIN=$(command -v python3 2>/dev/null || command -v python 2>/dev/null)
echo "Python: $PYTHON_BIN"
echo "Starting from /app/..."
exec "$PYTHON_BIN" /app/start_production.py
