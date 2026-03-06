"""
TCA Investment Analysis Platform - Refactored Main Application
"""

import logging
import json
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

# Configure logging
configure_logging()
logger = logging.getLogger(__name__)


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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting TCA Investment Analysis Platform...")

    try:
        # Initialize database connection
        await db_manager.connect()
        logger.info("Database connection established")

        # Initialize AI service connection
        from app.services import ai_client
        health = await ai_client.health_check()
        if health.get("status") == "healthy":
            logger.info("AI service connection established")
        else:
            logger.warning(f"AI service health check failed: {health}")

    except Exception as e:
        logger.error(f"Application startup failed: {e}")
        raise

    logger.info("Application startup completed successfully")

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
        openapi_url="/openapi.json" if not settings.is_production else None,
        default_response_class=CustomJSONResponse)

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

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["*"],
    )

    # Add trusted host middleware for production
    if settings.is_production:
        app.add_middleware(TrustedHostMiddleware,
                           allowed_hosts=settings.allowed_hosts)

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


# Root endpoint
@app.get("/", response_model=BaseResponse)
async def root():
    """Root endpoint with basic application information"""
    return BaseResponse(
        message=f"Welcome to {settings.app_name} v{settings.version}")


# Health check endpoint
@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Comprehensive health check endpoint"""
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
            external_apis={"status":
                           "healthy"}  # Placeholder for external API checks
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