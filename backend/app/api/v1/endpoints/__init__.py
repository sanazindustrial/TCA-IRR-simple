"""Endpoints module initialization"""

# Import all endpoint modules to ensure they're available
from . import (auth, users, companies, analysis, investments, tca, admin)

__all__ = [
    "auth", "users", "companies", "analysis", "investments", "tca", "admin"
]