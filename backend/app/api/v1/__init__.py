"""API v1 router initialization"""

from fastapi import APIRouter
from .endpoints import (auth, users, companies, analysis, investments, admin,
                        tca, dashboard, ssd, settings, creports, cost,
                        external_sources, api_routes, roles, ml)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(roles.router, tags=["Role Configuration"])
api_router.include_router(settings.router, tags=["Settings"])
api_router.include_router(creports.router, tags=["Reports"])
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
api_router.include_router(ssd.router, prefix="/ssd", tags=["SSD Integration"])

# Alias for /startup-steroid/* → /ssd/* (backwards compatibility)
api_router.include_router(ssd.router,
                          prefix="/startup-steroid",
                          tags=["Startup Steroid Integration"])

api_router.include_router(cost.router,
                          prefix="/cost",
                          tags=["Cost Management"])

api_router.include_router(external_sources.router,
                          prefix="/external",
                          tags=["External Sources"])

# API routes for files, uploads, modules, extraction, etc. (mounted at /api/*)
api_router.include_router(api_routes.files_router,
                          prefix="/files",
                          tags=["Files"])
api_router.include_router(api_routes.uploads_router,
                          prefix="/uploads",
                          tags=["Uploads"])
api_router.include_router(api_routes.modules_router,
                          prefix="/modules",
                          tags=["Modules"])
api_router.include_router(api_routes.extraction_router,
                          prefix="/extraction",
                          tags=["Extraction"])
api_router.include_router(api_routes.urls_router,
                          prefix="/urls",
                          tags=["URLs"])
api_router.include_router(api_routes.text_router,
                          prefix="/text",
                          tags=["Text"])
api_router.include_router(api_routes.requests_router,
                          prefix="/requests",
                          tags=["App Requests"])
api_router.include_router(api_routes.evaluations_router,
                          prefix="/evaluations",
                          tags=["Evaluations"])
api_router.include_router(api_routes.records_router,
                          prefix="/records",
                          tags=["Records"])
api_router.include_router(api_routes.api_health_router, tags=["API Health"])
api_router.include_router(ml.router, prefix="/ml", tags=["Machine Learning"])
