"""
Enhanced logging configuration for production monitoring
"""

import logging
import logging.config
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path

from app.core.config import settings


class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging"""

    def format(self, record):
        """Format log record as JSON"""
        log_data = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields if present
        if hasattr(record, 'extra_data'):
            log_data.update(record.extra_data)

        # Add request context if available
        for attr in [
                'method', 'url', 'status_code', 'process_time', 'client_ip',
                'user_agent'
        ]:
            if hasattr(record, attr):
                log_data[attr] = getattr(record, attr)

        return json.dumps(log_data)


class ColoredFormatter(logging.Formatter):
    """Colored formatter for development console output"""

    # Color codes
    COLORS = {
        'DEBUG': '\033[36m',  # Cyan
        'INFO': '\033[32m',  # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',  # Red
        'CRITICAL': '\033[35m',  # Magenta
        'RESET': '\033[0m'  # Reset
    }

    def format(self, record):
        """Format log record with colors for development"""
        color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
        record.levelname = f"{color}{record.levelname}{self.COLORS['RESET']}"

        return super().format(record)


class TCALoggerAdapter(logging.LoggerAdapter):
    """Custom logger adapter with TCA-specific context"""

    def process(self, msg, kwargs):
        """Add TCA context to log messages"""
        if 'extra' not in kwargs:
            kwargs['extra'] = {}

        # Add application context
        kwargs['extra'].update({
            'service': 'tca-platform',
            'version': settings.version,
            'environment': settings.environment
        })

        # Add user context if available
        if hasattr(self.extra, 'user_id'):
            kwargs['extra']['user_id'] = self.extra['user_id']
        if hasattr(self.extra, 'username'):
            kwargs['extra']['username'] = self.extra['username']

        return msg, kwargs


def setup_logging():
    """Setup comprehensive logging configuration"""

    # Create logs directory if it doesn't exist
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    # Determine log level
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    # Base logging configuration
    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {
                "()": JSONFormatter,
            },
            "colored": {
                "()":
                ColoredFormatter,
                "format":
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s [%(filename)s:%(lineno)d]"
            },
            "standard": {
                "format":
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s [%(filename)s:%(lineno)d]",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": log_level,
                "formatter":
                "colored" if settings.is_development else "standard",
                "stream": sys.stdout
            },
            "file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": log_level,
                "formatter": "json" if settings.is_production else "standard",
                "filename": log_dir / "tca-platform.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "encoding": "utf8"
            },
            "error_file": {
                "class": "logging.handlers.RotatingFileHandler",
                "level": "ERROR",
                "formatter": "json",
                "filename": log_dir / "tca-platform-errors.log",
                "maxBytes": 10485760,  # 10MB
                "backupCount": 5,
                "encoding": "utf8"
            }
        },
        "loggers": {
            "app": {
                "level": log_level,
                "handlers": ["console", "file"],
                "propagate": False
            },
            "app.api": {
                "level": log_level,
                "handlers": ["console", "file"],
                "propagate": False
            },
            "app.services": {
                "level": log_level,
                "handlers": ["console", "file"],
                "propagate": False
            },
            "app.db": {
                "level": log_level,
                "handlers": ["console", "file"],
                "propagate": False
            },
            "uvicorn": {
                "level": "INFO",
                "handlers": ["console"],
                "propagate": False
            },
            "uvicorn.access": {
                "level": "INFO",
                "handlers": ["file"],
                "propagate": False
            }
        },
        "root": {
            "level": "WARNING",
            "handlers": ["console", "error_file"]
        }
    }

    # Apply configuration
    logging.config.dictConfig(config)

    # Set up custom loggers
    setup_custom_loggers()


def setup_custom_loggers():
    """Setup custom loggers for different components"""

    # Database logger
    db_logger = logging.getLogger("app.db")
    db_logger.info("Database logger initialized")

    # API logger
    api_logger = logging.getLogger("app.api")
    api_logger.info("API logger initialized")

    # Service logger
    service_logger = logging.getLogger("app.services")
    service_logger.info("Services logger initialized")

    # Security logger
    security_logger = logging.getLogger("app.security")
    security_logger.info("Security logger initialized")


def get_logger(name: str, **context) -> TCALoggerAdapter:
    """
    Get a logger with TCA-specific context
    
    Args:
        name: Logger name
        **context: Additional context to include in logs
    
    Returns:
        Configured logger adapter
    """
    logger = logging.getLogger(name)
    return TCALoggerAdapter(logger, context)


class LogContext:
    """Context manager for adding context to logs"""

    def __init__(self, **context):
        self.context = context
        self.original_context = {}

    def __enter__(self):
        # Store and set context
        for key, value in self.context.items():
            if hasattr(logging, '_context'):
                self.original_context[key] = getattr(logging._context, key,
                                                     None)
                setattr(logging._context, key, value)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        # Restore original context
        for key, value in self.original_context.items():
            if hasattr(logging, '_context'):
                if value is None:
                    delattr(logging._context, key)
                else:
                    setattr(logging._context, key, value)


def log_performance(func_name: str, execution_time: float, **kwargs):
    """Log performance metrics"""
    logger = get_logger("app.performance")
    logger.info(f"Performance: {func_name} executed in {execution_time:.3f}s",
                extra_data={
                    "function": func_name,
                    "execution_time": execution_time,
                    **kwargs
                })


def log_security_event(event_type: str,
                       user_id: Optional[int] = None,
                       **details):
    """Log security-related events"""
    logger = get_logger("app.security")
    logger.warning(f"Security event: {event_type}",
                   extra_data={
                       "event_type": event_type,
                       "user_id": user_id,
                       "timestamp": datetime.utcnow().isoformat(),
                       **details
                   })


def log_business_event(event_type: str,
                       user_id: Optional[int] = None,
                       **details):
    """Log business logic events"""
    logger = get_logger("app.business")
    logger.info(f"Business event: {event_type}",
                extra_data={
                    "event_type": event_type,
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat(),
                    **details
                })


def log_api_request(method: str, url: str, status_code: int,
                    process_time: float, **kwargs):
    """Log API request details"""
    logger = get_logger("app.api.requests")

    log_level = logging.INFO
    if status_code >= 500:
        log_level = logging.ERROR
    elif status_code >= 400:
        log_level = logging.WARNING

    logger.log(log_level,
               f"{method} {url} - {status_code} - {process_time:.3f}s",
               extra_data={
                   "method": method,
                   "url": url,
                   "status_code": status_code,
                   "process_time": process_time,
                   **kwargs
               })


# Decorators for automatic logging
def log_function_call(logger_name: str = "app.functions"):
    """Decorator to automatically log function calls"""

    def decorator(func):

        def wrapper(*args, **kwargs):
            logger = get_logger(logger_name)
            start_time = datetime.utcnow()

            logger.debug(
                f"Calling {func.__name__} with args={args}, kwargs={kwargs}")

            try:
                result = func(*args, **kwargs)
                execution_time = (datetime.utcnow() -
                                  start_time).total_seconds()

                logger.debug(
                    f"{func.__name__} completed successfully in {execution_time:.3f}s",
                    extra_data={"execution_time": execution_time})

                return result

            except Exception as e:
                execution_time = (datetime.utcnow() -
                                  start_time).total_seconds()

                logger.error(
                    f"{func.__name__} failed after {execution_time:.3f}s: {str(e)}",
                    extra_data={
                        "execution_time": execution_time,
                        "error": str(e)
                    },
                    exc_info=True)
                raise

        return wrapper

    return decorator


# Initialize logging when module is imported
if not logging.getLogger().handlers:
    setup_logging()