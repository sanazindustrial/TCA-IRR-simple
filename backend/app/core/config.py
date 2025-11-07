"""
Core configuration settings for TCA Investment Analysis Platform
"""

import os
from typing import Optional, List
try:
    from pydantic_settings import BaseSettings
    from pydantic import field_validator
except ImportError:
    from pydantic import BaseSettings, validator as field_validator
import logging


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # Application Settings
    app_name: str = "TCA Investment Analysis Platform"
    version: str = "1.0.0"
    debug: bool = False
    environment: str = "production"

    # API Settings
    api_v1_prefix: str = "/api/v1"
    allowed_hosts: List[str] = ["*"]

    # Database Settings
    postgres_host: str = "tca-irr-server.postgres.database.azure.com"
    postgres_port: int = 5432
    postgres_db: str = "tca_platform"
    postgres_user: str = "tcairrserver"
    postgres_password: str = "Tc@1rr53rv5r"
    postgres_ssl_mode: str = "require"

    # Database Pool Settings
    db_pool_min_size: int = 5
    db_pool_max_size: int = 20
    db_pool_max_queries: int = 50000
    db_pool_max_inactive_time: float = 300

    # Security Settings
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # AI Integration Settings
    genkit_host: str = "http://localhost:3100"
    genkit_timeout: int = 300

    # External API Settings
    external_api_timeout: int = 30
    external_api_retries: int = 3

    # Logging Settings
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # CORS Settings
    cors_origins: List[str] = [
        "http://localhost:3000", "https://tca-irr-app.azurewebsites.net",
        "https://localhost:3000"
    ]

    @field_validator("environment")
    def validate_environment(cls, v):
        valid_environments = ["development", "staging", "production"]
        if v not in valid_environments:
            raise ValueError(
                f"Environment must be one of {valid_environments}")
        return v

    @property
    def database_url(self) -> str:
        """Construct PostgreSQL database URL"""
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
            f"?sslmode={self.postgres_ssl_mode}")

    @property
    def is_development(self) -> bool:
        return self.environment == "development"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()


def configure_logging():
    """Configure application logging"""
    from .logging_config import setup_logging
    setup_logging()


def get_settings() -> Settings:
    """Get application settings (for dependency injection)"""
    return settings