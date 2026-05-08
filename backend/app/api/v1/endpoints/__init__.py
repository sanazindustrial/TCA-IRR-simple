"""Endpoints module initialization"""

# Import all endpoint modules to ensure they're available
from . import (
    auth,
    users, 
    companies, 
    analysis, 
    investments, 
    tca, 
    admin, 
    dashboard, 
    ssd,
    settings,
    reports,
    cost,
    external_sources,
    api_routes,
    ml
)

__all__ = [
    "auth", 
    "users", 
    "companies", 
    "analysis", 
    "investments", 
    "tca", 
    "admin", 
    "dashboard", 
    "ssd",
    "settings",
    "reports",
    "cost",
    "external_sources",
    "api_routes",
    "ml"
]