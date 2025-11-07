"""
Error handling middleware for comprehensive error management
"""

import logging
import traceback
import time
from typing import Callable
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.json_utils import DateTimeEncoder
import json

from app.models import ErrorResponse

logger = logging.getLogger(__name__)


def create_json_response(content, status_code: int = 200, headers=None):
    """Create JSONResponse with datetime serialization support"""
    from starlette.responses import Response
    json_content = json.dumps(content, cls=DateTimeEncoder)
    return Response(content=json_content,
                    status_code=status_code,
                    headers=headers,
                    media_type="application/json")


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware for centralized error handling and logging"""

    async def dispatch(self, request: Request,
                       call_next: Callable) -> Response:
        start_time = time.time()

        try:
            response = await call_next(request)
            process_time = time.time() - start_time

            # Log successful requests
            logger.info(f"{request.method} {request.url} "
                        f"- {response.status_code} "
                        f"- {process_time:.3f}s")

            return response

        except Exception as exc:
            process_time = time.time() - start_time

            # Log the error with full traceback
            logger.error(
                f"Unhandled exception in {request.method} {request.url}: {exc}",
                exc_info=True,
                extra={
                    "method": request.method,
                    "url": str(request.url),
                    "process_time": process_time,
                    "traceback": traceback.format_exc()
                })

            # Return standardized error response
            return create_json_response(
                content=ErrorResponse(message="Internal server error",
                                      error_code="INTERNAL_SERVER_ERROR",
                                      details={
                                          "request_id": id(request)
                                      } if not request.app.debug else {
                                          "request_id": id(request),
                                          "traceback": traceback.format_exc()
                                      }).dict(),
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware for adding security headers"""

    async def dispatch(self, request: Request,
                       call_next: Callable) -> Response:
        response = await call_next(request)

        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers[
            "Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Remove server header
        if "server" in response.headers:
            del response.headers["server"]

        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for detailed request logging"""

    async def dispatch(self, request: Request,
                       call_next: Callable) -> Response:
        start_time = time.time()

        # Log incoming request
        logger.info(f"Request started: {request.method} {request.url}",
                    extra={
                        "method": request.method,
                        "url": str(request.url),
                        "client_ip":
                        request.client.host if request.client else "unknown",
                        "user_agent":
                        request.headers.get("user-agent", "unknown"),
                        "content_type": request.headers.get("content-type"),
                        "content_length": request.headers.get("content-length")
                    })

        response = await call_next(request)

        process_time = time.time() - start_time

        # Log response
        logger.info(
            f"Request completed: {request.method} {request.url} "
            f"- {response.status_code} - {process_time:.3f}s",
            extra={
                "method": request.method,
                "url": str(request.url),
                "status_code": response.status_code,
                "process_time": process_time,
                "response_size": response.headers.get("content-length")
            })

        return response


class RateLimitingMiddleware(BaseHTTPMiddleware):
    """Simple rate limiting middleware"""

    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = {}  # In production, use Redis or similar

    async def dispatch(self, request: Request,
                       call_next: Callable) -> Response:
        # Get client IP
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()

        # Clean old entries
        cutoff_time = current_time - self.window_seconds
        self.requests = {
            ip: timestamps
            for ip, timestamps in self.requests.items()
            if any(ts > cutoff_time for ts in timestamps)
        }

        # Update timestamps for this IP
        if client_ip in self.requests:
            self.requests[client_ip] = [
                ts for ts in self.requests[client_ip] if ts > cutoff_time
            ]
            self.requests[client_ip].append(current_time)
        else:
            self.requests[client_ip] = [current_time]

        # Check rate limit
        if len(self.requests[client_ip]) > self.max_requests:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return create_json_response(
                content=ErrorResponse(message="Rate limit exceeded",
                                      error_code="RATE_LIMIT_EXCEEDED",
                                      details={
                                          "retry_after": self.window_seconds
                                      }).dict(),
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                headers={"Retry-After": str(self.window_seconds)})

        return await call_next(request)