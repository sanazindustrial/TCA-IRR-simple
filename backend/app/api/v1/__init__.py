"""API v1 router initialization"""

from fastapi import APIRouter
from .endpoints import (auth, users, companies, analysis, investments, admin,
                        tca, dashboard)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(companies.router,
                          prefix="/companies",
                          tags=["Companies"])
api_router.include_router(analysis.router,
                          prefix="/analysis",
                          tags=["Analysis"])
api_router.include_router(investments.router,
                          prefix="/investments",
                          tags=["Investments"])
api_router.include_router(tca.router, prefix="/tca", tags=["TCA Analysis"])
api_router.include_router(dashboard.router,
                          prefix="/dashboard",
                          tags=["Dashboard"])
api_router.include_router(admin.router,
                          prefix="/admin",
                          tags=["Administration"])
