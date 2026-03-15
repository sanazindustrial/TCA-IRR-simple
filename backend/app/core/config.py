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

logger = logging.getLogger(__name__)


def get_secret_from_keyvault(secret_name: str, default: str = None) -> str:
    """
    Fetch secret from Azure Key Vault if available, otherwise use default.
    Requires: azure-identity, azure-keyvault-secrets packages
    """
    keyvault_url = os.environ.get("AZURE_KEYVAULT_URL")
    if not keyvault_url:
        return default or os.environ.get(secret_name, "")
    
    try:
        from azure.identity import DefaultAzureCredential
        from azure.keyvault.secrets import SecretClient
        
        credential = DefaultAzureCredential()
        client = SecretClient(vault_url=keyvault_url, credential=credential)
        secret = client.get_secret(secret_name)
        logger.info(f"Successfully loaded secret '{secret_name}' from Azure Key Vault")
        return secret.value
    except ImportError:
        logger.warning("Azure Key Vault SDK not installed. Using environment variables.")
        return default or os.environ.get(secret_name, "")
    except Exception as e:
        logger.warning(f"Failed to get secret '{secret_name}' from Key Vault: {e}. Using default.")
        return default or os.environ.get(secret_name, "")


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

    # Azure Key Vault Settings (for production secrets)
    azure_keyvault_url: Optional[str] = None  # e.g., "https://tca-irr-vault.vault.azure.net"

    # Database Settings
    postgres_host: str = "tca-irr-server.postgres.database.azure.com"
    postgres_port: int = 5432
    postgres_db: str = "tca_platform"
    postgres_user: str = "tcairrserver"
    postgres_password: str = "Tc@1rr53rv5r"  # Will be overridden from Key Vault in production
    postgres_ssl_mode: str = "require"

    # Database Pool Settings
    db_pool_min_size: int = 5
    db_pool_max_size: int = 20
    db_pool_max_queries: int = 50000
    db_pool_max_inactive_time: float = 300

    # Security Settings (overridden from Key Vault in production)
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # AI Integration Settings
    genkit_host: str = "http://localhost:3100"
    genkit_timeout: int = 300
    
    # OpenAI Settings (fallback when Genkit unavailable)
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o"
    openai_timeout: int = 120

    # External API Settings
    external_api_timeout: int = 30
    external_api_retries: int = 3

    # Logging Settings
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # CORS Settings
    cors_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://localhost:3000",
        "https://tca-irr.azurewebsites.net",
        "https://tca-irr-app.azurewebsites.net",
        "https://tcairrapiccontainer.azurewebsites.net",
        "*"
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

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore"
    }


# Global settings instance
settings = Settings()


def load_secrets_from_keyvault():
    """Load sensitive settings from Azure Key Vault in production"""
    global settings
    
    if not settings.azure_keyvault_url:
        logger.info("Azure Key Vault URL not configured. Using local settings.")
        return
    
    logger.info(f"Loading secrets from Azure Key Vault: {settings.azure_keyvault_url}")
    
    # Load secret key
    secret_key = get_secret_from_keyvault("jwt-secret-key", settings.secret_key)
    if secret_key and secret_key != settings.secret_key:
        settings.secret_key = secret_key
    
    # Load database password
    db_password = get_secret_from_keyvault("postgres-password", settings.postgres_password)
    if db_password and db_password != settings.postgres_password:
        settings.postgres_password = db_password
    
    logger.info("Secrets loaded from Azure Key Vault successfully")


# Auto-load secrets from Key Vault on module import (production only)
if settings.is_production and settings.azure_keyvault_url:
    load_secrets_from_keyvault()


def configure_logging():
    """Configure application logging"""
    from .logging_config import setup_logging
    setup_logging()


def get_settings() -> Settings:
    """Get application settings (for dependency injection)"""
    return settings