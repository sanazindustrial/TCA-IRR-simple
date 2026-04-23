"""
TCA Investment Analysis Platform - Refactored Main Application
OPTIMIZED FOR FAST STARTUP - Heavy initialization is deferred to background tasks
"""

import logging
import json
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.utils import get_openapi
from fastapi.encoders import jsonable_encoder
from app.utils.json_utils import DateTimeEncoder

from app.core import settings, configure_logging
from app.db import db_manager
from app.models import BaseResponse, ErrorResponse, HealthCheck
from app.api.v1 import api_router
from app.api.documentation import custom_openapi_schema
from app.middleware import (ErrorHandlingMiddleware, SecurityHeadersMiddleware,
                            RequestLoggingMiddleware, RateLimitingMiddleware)

# Configure logging EARLY but don't block
configure_logging()
logger = logging.getLogger(__name__)

# Global state for background initialization
_app_ready = False
_init_error = None


class CustomJSONResponse(JSONResponse):
    """Custom JSONResponse with datetime serialization support"""

    def render(self, content) -> bytes:
        return json.dumps(content,
                          ensure_ascii=False,
                          allow_nan=False,
                          indent=None,
                          separators=(",", ":"),
                          cls=DateTimeEncoder).encode("utf-8")


def create_json_response_with_datetime(content, status_code: int = 200):
    """Create JSONResponse with datetime serialization support"""
    from starlette.responses import Response
    json_content = json.dumps(content, cls=DateTimeEncoder)
    return Response(content=json_content,
                    status_code=status_code,
                    media_type="application/json")


async def _run_migrations():
    """Apply pending SQL migration files in order"""
    import glob
    import pathlib
    migrations_dir = pathlib.Path(__file__).parent / "app" / "db" / "migrations"
    sql_files = sorted(migrations_dir.glob("*.sql"))
    async with db_manager.pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        for sql_file in sql_files:
            already = await conn.fetchval(
                "SELECT 1 FROM schema_migrations WHERE filename = $1", sql_file.name
            )
            if not already:
                sql = sql_file.read_text(encoding="utf-8")
                await conn.execute(sql)
                await conn.execute(
                    "INSERT INTO schema_migrations (filename) VALUES ($1)", sql_file.name
                )
                logger.info(f"Background: Applied migration {sql_file.name}")


async def _background_init():
    """Heavy initialization in background - doesn't block startup"""
    global _app_ready, _init_error
    
    try:
        logger.info("Background: Starting database connection...")
        await db_manager.connect()
        logger.info("Background: Database connection established")

        # Run pending migrations
        try:
            await _run_migrations()
            logger.info("Background: Migrations completed")
        except Exception as e:
            logger.warning(f"Background: Migration warning (non-fatal): {e}")

        # Initialize AI service connection (non-blocking, just log status)
        try:
            from app.services import ai_client
            health = await asyncio.wait_for(ai_client.health_check(), timeout=10.0)
            if health.get("status") == "healthy":
                logger.info("Background: AI service connection established")
            else:
                logger.warning(f"Background: AI service health check failed: {health}")
        except asyncio.TimeoutError:
            logger.warning("Background: AI service health check timed out (continuing anyway)")
        except Exception as e:
            logger.warning(f"Background: AI service init warning: {e} (continuing anyway)")

        _app_ready = True
        logger.info("Background: All services initialized successfully")

    except Exception as e:
        _init_error = str(e)
        logger.error(f"Background: Initialization failed: {e}")
        # Don't re-raise - let app continue running with degraded state


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - FAST STARTUP"""
    # Startup - just schedule background init, don't wait
    logger.info("Starting TCA Investment Analysis Platform (fast mode)...")
    
    # Schedule heavy init in background - DON'T await it
    asyncio.create_task(_background_init())
    
    logger.info("Application started - background initialization in progress")

    yield

    # Shutdown
    logger.info("Shutting down TCA Investment Analysis Platform...")

    try:
        await db_manager.disconnect()
        logger.info("Database connection closed")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")

    logger.info("Application shutdown completed")


def create_application() -> FastAPI:
    """Create and configure FastAPI application"""

    app = FastAPI(
        title=settings.app_name,
        description=
        "Technology Company Assessment and Investment Risk Rating Platform",
        version=settings.version,
        debug=settings.debug,
        lifespan=lifespan,
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        openapi_url="/openapi.json",  # Always enabled — required by frontend API clients
        default_response_class=CustomJSONResponse,
        redirect_slashes=True)  # Re-enabled with proxy_headers=True in uvicorn for HTTPS redirects

    # Add custom middleware
    app.add_middleware(ErrorHandlingMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)

    if not settings.is_production:
        app.add_middleware(RequestLoggingMiddleware)

    # Add rate limiting in production
    if settings.is_production:
        app.add_middleware(RateLimitingMiddleware,
                           max_requests=1000,
                           window_seconds=60)

    # Add trusted host middleware for production (must be before CORS)
    if settings.is_production:
        app.add_middleware(TrustedHostMiddleware,
                           allowed_hosts=settings.allowed_hosts)

    # Configure CORS - must be added LAST so it runs FIRST
    # This ensures CORS headers are added to all responses
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins for now
        allow_credentials=True,
        allow_methods=["*"],  # Allow all methods
        allow_headers=["*"],  # Allow all headers
        expose_headers=["*"],
    )

    # Include API routes
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return CustomJSONResponse(
            content=ErrorResponse(message="Internal server error",
                                  error_code="INTERNAL_ERROR").dict(),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # HTTP exception handler
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request, exc):
        logger.warning(f"HTTP exception: {exc.detail}")
        return create_json_response_with_datetime(content=ErrorResponse(
            message=exc.detail, error_code=f"HTTP_{exc.status_code}").dict(),
                                                  status_code=exc.status_code)

    # Custom OpenAPI schema
    app.openapi = lambda: custom_openapi_schema(app)

    return app


# Create application instance
app = create_application()


# =============================================================================
# FAST HEALTH ENDPOINTS - These respond INSTANTLY for Azure health probes
# =============================================================================

@app.get("/", response_model=None)
async def root():
    """Root endpoint - INSTANT response for Azure health probe"""
    return {"status": "ok", "app": settings.app_name, "version": settings.version}


@app.get("/health", response_model=None)
async def health_check_fast():
    """Fast health check - responds instantly for Azure startup probe"""
    return {
        "status": "healthy" if _app_ready else "starting",
        "version": settings.version,
        "ready": _app_ready,
        "error": _init_error
    }


@app.get("/healthz", response_model=None)
async def healthz():
    """Kubernetes-style health endpoint - INSTANT"""
    return {"status": "ok"}


@app.get("/ready", response_model=None)
async def readiness():
    """Readiness probe - checks if background init is complete"""
    if _app_ready:
        return {"status": "ready", "services": "initialized"}
    elif _init_error:
        return JSONResponse(
            status_code=503,
            content={"status": "error", "message": _init_error}
        )
    else:
        return JSONResponse(
            status_code=503, 
            content={"status": "starting", "message": "Services initializing..."}
        )


# =============================================================================
# DETAILED HEALTH ENDPOINT - Only call this when needed (slow)
# =============================================================================

@app.get("/health/detailed", response_model=HealthCheck)
async def health_check_detailed():
    """Comprehensive health check endpoint - checks DB and AI (SLOW)"""
    try:
        # Check database health
        db_health = await db_manager.health_check()

        # Check AI service health
        from app.services import ai_client
        ai_health = await ai_client.health_check()

        # Determine overall status
        overall_status = "healthy"
        if db_health.get("status") != "healthy" or ai_health.get(
                "status") != "healthy":
            overall_status = "degraded" if db_health.get(
                "status") == "healthy" or ai_health.get(
                    "status") == "healthy" else "unhealthy"

        return HealthCheck(
            status=overall_status,
            version=settings.version,
            environment=settings.environment,
            database=db_health,
            ai_service=ai_health,
            external_apis={"status": "healthy"}
        )

    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return HealthCheck(status="unhealthy",
                           version=settings.version,
                           environment=settings.environment,
                           database={
                               "status": "unhealthy",
                               "error": str(e)
                           },
                           ai_service={"status": "unknown"},
                           external_apis={"status": "unknown"})


# Metrics endpoint (for monitoring)
@app.get("/metrics")
async def metrics():
    """Basic metrics endpoint for monitoring systems"""
    if not settings.is_production:
        return {"message": "Metrics available in production"}

    # Basic metrics - extend as needed
    return {
        "uptime": "healthy",
        "requests": "healthy",
        "database_connections": "healthy"
    }