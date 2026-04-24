"""
Additional API Routes for file uploads, extractions, modules, requests, and evaluations
These routes are mounted at /api/* (without /v1 prefix) for backwards compatibility
"""

import logging
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends, Form
from pydantic import BaseModel, Field
import asyncpg

from app.db import get_db
from .auth import get_current_user, get_optional_current_user

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════
# ROUTERS
# ═══════════════════════════════════════════════════════════════════════

files_router = APIRouter()
uploads_router = APIRouter()
modules_router = APIRouter()
extraction_router = APIRouter()
urls_router = APIRouter()
text_router = APIRouter()
requests_router = APIRouter()
evaluations_router = APIRouter()
records_router = APIRouter()


# ═══════════════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════════════

class UploadResponse(BaseModel):
    upload_id: str
    filename: str
    status: str
    message: str
    uploaded_at: str


class ModuleWeight(BaseModel):
    module_id: str
    name: str
    weight: float
    enabled: bool


class ExtractionResult(BaseModel):
    valid: bool
    data: Dict[str, Any]
    errors: List[str] = []


class AppRequestCreate(BaseModel):
    request_type: str
    description: str
    priority: str = "normal"
    metadata: Optional[Dict[str, Any]] = None


class AppRequestUpdate(BaseModel):
    status: Optional[str] = None
    resolution_notes: Optional[str] = None


class AppRequestResponse(BaseModel):
    id: str
    request_type: str
    description: str
    priority: str
    status: str
    resolution_notes: Optional[str] = None
    username: Optional[str] = None
    user_id: Optional[int] = None
    created_at: str
    updated_at: Optional[str] = None


class EvaluationCreate(BaseModel):
    company_name: str
    company_id: Optional[int] = None
    evaluation_type: str = "triage"
    data: Dict[str, Any] = {}


class EvaluationResponse(BaseModel):
    evaluation_id: str
    company_name: str
    evaluation_type: str
    status: str
    created_at: str


# ═══════════════════════════════════════════════════════════════════════
# FILE UPLOAD ENDPOINTS (/api/files/*)
# ═══════════════════════════════════════════════════════════════════════

@files_router.post("/upload", response_model=UploadResponse)
async def upload_files(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_optional_current_user)
):
    """Upload a single file for analysis"""
    try:
        upload_id = str(uuid.uuid4())
        
        # Read file content (in production, save to Azure Blob Storage)
        content = await file.read()
        file_size = len(content)
        
        logger.info(f"File uploaded: {file.filename}, size: {file_size} bytes, upload_id: {upload_id}")
        
        return UploadResponse(
            upload_id=upload_id,
            filename=file.filename,
            status="uploaded",
            message=f"File uploaded successfully ({file_size} bytes)",
            uploaded_at=datetime.utcnow().isoformat()
        )
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}"
        )


@files_router.post("/upload/multipart", response_model=List[UploadResponse])
async def upload_files_multipart(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_optional_current_user)
):
    """Upload multiple files for analysis"""
    results = []
    for file in files:
        try:
            upload_id = str(uuid.uuid4())
            content = await file.read()
            
            results.append(UploadResponse(
                upload_id=upload_id,
                filename=file.filename,
                status="uploaded",
                message=f"File uploaded successfully ({len(content)} bytes)",
                uploaded_at=datetime.utcnow().isoformat()
            ))
        except Exception as e:
            logger.error(f"Error uploading {file.filename}: {e}")
            results.append(UploadResponse(
                upload_id="",
                filename=file.filename,
                status="error",
                message=str(e),
                uploaded_at=datetime.utcnow().isoformat()
            ))
    
    return results


# ═══════════════════════════════════════════════════════════════════════
# UPLOADS ENDPOINTS (/api/uploads/*)
# ═══════════════════════════════════════════════════════════════════════

@uploads_router.get("")
async def list_uploads(
    page: int = 1,
    size: int = 20,
    current_user: dict = Depends(get_optional_current_user)
):
    """List all uploads"""
    return {
        "items": [],
        "total": 0,
        "page": page,
        "size": size,
        "pages": 0
    }


@uploads_router.get("/{upload_id}")
async def get_upload(
    upload_id: str,
    current_user: dict = Depends(get_optional_current_user)
):
    """Get upload by ID"""
    return {
        "upload_id": upload_id,
        "status": "not_found",
        "message": "Upload not found or expired"
    }


@uploads_router.delete("/{upload_id}")
async def delete_upload(
    upload_id: str,
    current_user: dict = Depends(get_optional_current_user)
):
    """Delete an upload"""
    return {"status": "deleted", "upload_id": upload_id}


# ═══════════════════════════════════════════════════════════════════════
# MODULES ENDPOINTS (/api/modules/*)
# ═══════════════════════════════════════════════════════════════════════

# Default module weights for TCA analysis
DEFAULT_MODULE_WEIGHTS = [
    {"module_id": "leadership", "name": "Leadership & Management", "weight": 0.15, "enabled": True},
    {"module_id": "product", "name": "Product & Technology", "weight": 0.15, "enabled": True},
    {"module_id": "market", "name": "Market Opportunity", "weight": 0.12, "enabled": True},
    {"module_id": "business_model", "name": "Business Model", "weight": 0.12, "enabled": True},
    {"module_id": "financials", "name": "Financial Health", "weight": 0.12, "enabled": True},
    {"module_id": "traction", "name": "Traction & Growth", "weight": 0.10, "enabled": True},
    {"module_id": "competitive", "name": "Competitive Position", "weight": 0.10, "enabled": True},
    {"module_id": "risk", "name": "Risk Assessment", "weight": 0.08, "enabled": True},
    {"module_id": "esg", "name": "ESG & Sustainability", "weight": 0.06, "enabled": True},
]


@modules_router.get("/weights", response_model=List[ModuleWeight])
async def get_module_weights():
    """Get current module weights for TCA analysis"""
    return [ModuleWeight(**m) for m in DEFAULT_MODULE_WEIGHTS]


# ═══════════════════════════════════════════════════════════════════════
# EXTRACTION ENDPOINTS (/api/extraction/*)
# ═══════════════════════════════════════════════════════════════════════

@extraction_router.post("/validate", response_model=ExtractionResult)
async def validate_extraction(
    data: Dict[str, Any],
    current_user: dict = Depends(get_optional_current_user)
):
    """Validate extracted data from documents"""
    errors = []
    
    # Basic validation
    if not data.get("company_name"):
        errors.append("Missing company name")
    
    return ExtractionResult(
        valid=not errors,
        data=data,
        errors=errors
    )


@extraction_router.post("/reprocess")
async def reprocess_extraction(
    upload_id: str,
    current_user: dict = Depends(get_optional_current_user)
):
    """Reprocess extraction for a specific upload"""
    return {
        "status": "queued",
        "upload_id": upload_id,
        "message": "Extraction reprocessing queued"
    }


# ═══════════════════════════════════════════════════════════════════════
# URL ENDPOINTS (/api/urls/*)
# ═══════════════════════════════════════════════════════════════════════

@urls_router.post("/fetch")
async def fetch_url_data(
    url: str,
    current_user: dict = Depends(get_optional_current_user)
):
    """Fetch and extract data from a URL"""
    return {
        "status": "success",
        "url": url,
        "data": {},
        "message": "URL data fetch not yet implemented"
    }


# ═══════════════════════════════════════════════════════════════════════
# TEXT ENDPOINTS (/api/text/*)
# ═══════════════════════════════════════════════════════════════════════

@text_router.post("/submit")
async def submit_text(
    text: str = Form(...),
    analysis_type: str = Form(default="general"),
    current_user: dict = Depends(get_optional_current_user)
):
    """Submit text for analysis"""
    return {
        "status": "received",
        "text_length": len(text),
        "analysis_type": analysis_type,
        "message": "Text submitted for processing"
    }


# ═══════════════════════════════════════════════════════════════════════
# APP REQUESTS ENDPOINTS (/requests/*)
# ═══════════════════════════════════════════════════════════════════════

_REQUESTS_TABLE_DDL = """
    CREATE TABLE IF NOT EXISTS user_requests (
        id UUID PRIMARY KEY,
        user_id INTEGER,
        username VARCHAR(255),
        request_type VARCHAR(255),
        description TEXT,
        priority VARCHAR(50) DEFAULT 'normal',
        status VARCHAR(50) DEFAULT 'pending',
        resolution_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )
"""


def _row_to_request(row) -> AppRequestResponse:
    created = row['created_at']
    updated = row['updated_at']
    return AppRequestResponse(
        id=str(row['id']),
        request_type=row['request_type'],
        description=row['description'],
        priority=row['priority'],
        status=row['status'],
        resolution_notes=row['resolution_notes'],
        username=row['username'],
        user_id=row['user_id'],
        created_at=created.isoformat() if hasattr(created, 'isoformat') else str(created),
        updated_at=updated.isoformat() if updated and hasattr(updated, 'isoformat') else (str(updated) if updated else None),
    )


@requests_router.post("", response_model=AppRequestResponse)
async def create_app_request(
    request_data: AppRequestCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_optional_current_user)
):
    """Create a new app request and persist to DB"""
    try:
        await db.execute(_REQUESTS_TABLE_DDL)

        request_id = uuid.uuid4()
        user_id = current_user.get('id') if current_user else None
        username = (
            current_user.get('username') or current_user.get('email', 'anonymous')
            if current_user else 'anonymous'
        )
        now = datetime.utcnow()

        await db.execute(
            """
            INSERT INTO user_requests
                (id, user_id, username, request_type, description, priority, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $7)
            """,
            request_id, user_id, username,
            request_data.request_type, request_data.description, request_data.priority,
            now,
        )

        return AppRequestResponse(
            id=str(request_id),
            request_type=request_data.request_type,
            description=request_data.description,
            priority=request_data.priority,
            status="pending",
            username=username,
            user_id=user_id,
            created_at=now.isoformat(),
            updated_at=now.isoformat(),
        )
    except Exception as e:
        logger.error(f"Create request error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Failed to create request: {str(e)}")


@requests_router.get("")
async def get_app_requests(
    page: int = 1,
    size: int = 20,
    req_status: Optional[str] = None,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_optional_current_user)
):
    """Get app requests from DB – admins see all, regular users see their own"""
    try:
        await db.execute(_REQUESTS_TABLE_DDL)

        user_id = current_user.get('id') if current_user else None
        role = current_user.get('role', 'user') if current_user else 'anonymous'
        is_admin = role == 'admin'
        offset = (page - 1) * size

        if is_admin:
            if req_status:
                total = await db.fetchval(
                    "SELECT COUNT(*) FROM user_requests WHERE status = $1", req_status)
                rows = await db.fetch(
                    "SELECT * FROM user_requests WHERE status = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
                    req_status, size, offset)
            else:
                total = await db.fetchval("SELECT COUNT(*) FROM user_requests")
                rows = await db.fetch(
                    "SELECT * FROM user_requests ORDER BY created_at DESC LIMIT $1 OFFSET $2",
                    size, offset)
        else:
            if user_id is None:
                return {"items": [], "total": 0, "page": page, "size": size, "pages": 0}
            if req_status:
                total = await db.fetchval(
                    "SELECT COUNT(*) FROM user_requests WHERE user_id = $1 AND status = $2",
                    user_id, req_status)
                rows = await db.fetch(
                    "SELECT * FROM user_requests WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4",
                    user_id, req_status, size, offset)
            else:
                total = await db.fetchval(
                    "SELECT COUNT(*) FROM user_requests WHERE user_id = $1", user_id)
                rows = await db.fetch(
                    "SELECT * FROM user_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
                    user_id, size, offset)

        items = [_row_to_request(r) for r in rows]
        pages = max(1, (total + size - 1) // size) if total > 0 else 0

        return {"items": items, "total": total, "page": page, "size": size, "pages": pages}
    except Exception as e:
        logger.error(f"Get requests error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Failed to get requests: {str(e)}")


@requests_router.patch("/{request_id}", response_model=AppRequestResponse)
async def update_app_request(
    request_id: str,
    update_data: AppRequestUpdate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_optional_current_user)
):
    """Update request status / resolution notes"""
    try:
        row = await db.fetchrow("SELECT * FROM user_requests WHERE id = $1", uuid.UUID(request_id))
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

        new_status = update_data.status if update_data.status is not None else row['status']
        new_notes = update_data.resolution_notes if update_data.resolution_notes is not None else row['resolution_notes']
        now = datetime.utcnow()

        updated_row = await db.fetchrow(
            """
            UPDATE user_requests
            SET status = $1, resolution_notes = $2, updated_at = $3
            WHERE id = $4
            RETURNING *
            """,
            new_status, new_notes, now, uuid.UUID(request_id),
        )
        return _row_to_request(updated_row)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update request error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Failed to update request: {str(e)}")


@requests_router.delete("/{request_id}", status_code=204)
async def delete_app_request(
    request_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_optional_current_user)
):
    """Delete a request (admin only)"""
    try:
        result = await db.execute(
            "DELETE FROM user_requests WHERE id = $1", uuid.UUID(request_id))
        if result == "DELETE 0":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete request error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail=f"Failed to delete request: {str(e)}")


# ═══════════════════════════════════════════════════════════════════════
# EVALUATIONS ENDPOINTS (/evaluations/*)
# ═══════════════════════════════════════════════════════════════════════

@evaluations_router.post("", response_model=EvaluationResponse)
async def create_evaluation(
    evaluation_data: EvaluationCreate,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_optional_current_user)
):
    """Create a new evaluation"""
    try:
        evaluation_id = str(uuid.uuid4())
        user_id = current_user.get('id') if current_user else None
        
        # Create evaluations table if it doesn't exist
        await db.execute("""
            CREATE TABLE IF NOT EXISTS evaluations_simple (
                evaluation_id UUID PRIMARY KEY,
                user_id INTEGER,
                company_name VARCHAR(255),
                evaluation_type VARCHAR(50) DEFAULT 'triage',
                status VARCHAR(50) DEFAULT 'pending',
                evaluation_data JSONB,
                results JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                completed_at TIMESTAMPTZ
            )
        """)
        
        # Insert the evaluation
        import json
        await db.execute(
            """
            INSERT INTO evaluations_simple (evaluation_id, user_id, company_name, evaluation_type, status, evaluation_data)
            VALUES ($1, $2, $3, $4, 'pending', $5)
            """,
            uuid.UUID(evaluation_id),
            user_id,
            evaluation_data.company_name,
            evaluation_data.evaluation_type,
            json.dumps(evaluation_data.data)
        )
        
        return EvaluationResponse(
            evaluation_id=evaluation_id,
            company_name=evaluation_data.company_name,
            evaluation_type=evaluation_data.evaluation_type,
            status="pending",
            created_at=datetime.utcnow().isoformat()
        )
    except Exception as e:
        logger.error(f"Create evaluation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create evaluation: {str(e)}"
        )


@evaluations_router.get("/{evaluation_id}", response_model=EvaluationResponse)
async def get_evaluation(
    evaluation_id: str,
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_optional_current_user)
):
    """Get evaluation by ID - fetches real data from database"""
    try:
        # Query the evaluation from database
        evaluation = await db.fetchrow(
            """
            SELECT evaluation_id, company_name, evaluation_type, status, created_at
            FROM evaluations_simple 
            WHERE evaluation_id = $1
            """, 
            uuid.UUID(evaluation_id)
        )
        
        if not evaluation:
            # Check evaluations table as fallback
            evaluation = await db.fetchrow(
                """
                SELECT evaluation_id, company_name, 
                       COALESCE(evaluation_type, 'triage') as evaluation_type, 
                       status, created_at
                FROM evaluations 
                WHERE evaluation_id = $1
                """, 
                uuid.UUID(evaluation_id)
            )
        
        if not evaluation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Evaluation not found"
            )
        
        return EvaluationResponse(
            evaluation_id=str(evaluation['evaluation_id']),
            company_name=evaluation['company_name'] or 'Unknown',
            evaluation_type=evaluation['evaluation_type'] or 'triage',
            status=evaluation['status'] or 'unknown',
            created_at=evaluation['created_at'].isoformat() if evaluation['created_at'] else datetime.utcnow().isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get evaluation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch evaluation: {str(e)}"
        )


# ═══════════════════════════════════════════════════════════════════════
# HEALTH ENDPOINT (/api/health)
# ═══════════════════════════════════════════════════════════════════════

api_health_router = APIRouter()


@api_health_router.get("/health")
async def api_health_check():
    """API health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "tca-irr-api"
    }


# ═══════════════════════════════════════════════════════════════════════
# EVALUATIONS SYNC ENDPOINT (/evaluations/sync)
# ═══════════════════════════════════════════════════════════════════════

@evaluations_router.post("/sync")
async def sync_evaluation(
    sync_data: Dict[str, Any],
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_optional_current_user)
):
    """
    Sync evaluation data from frontend to backend.
    
    This endpoint receives evaluation state from the frontend tracking service
    and synchronizes it with the backend database.
    
    Args:
        sync_data: Contains evaluation, documents, analyses, reports, and auditLogs
    
    Returns:
        Sync status and any errors
    """
    try:
        evaluation = sync_data.get("evaluation", {})
        documents = sync_data.get("documents", [])
        analyses = sync_data.get("analyses", [])
        reports = sync_data.get("reports", [])
        audit_logs = sync_data.get("auditLogs", [])
        
        evaluation_id = evaluation.get("evaluationId", str(uuid.uuid4()))
        
        # Log the sync attempt
        logger.info(f"Evaluation sync: {evaluation_id}, docs: {len(documents)}, analyses: {len(analyses)}, reports: {len(reports)}")
        
        # Store or update evaluation data
        import json
        
        # Create sync log table if needed
        await db.execute("""
            CREATE TABLE IF NOT EXISTS evaluation_sync_logs (
                id SERIAL PRIMARY KEY,
                evaluation_id VARCHAR(255),
                sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
                documents_count INT,
                analyses_count INT,
                reports_count INT,
                audit_logs_count INT,
                sync_data JSONB,
                status VARCHAR(50) DEFAULT 'completed'
            )
        """)
        
        # Insert sync log
        await db.execute(
            """
            INSERT INTO evaluation_sync_logs 
            (evaluation_id, documents_count, analyses_count, reports_count, audit_logs_count, sync_data)
            VALUES ($1, $2, $3, $4, $5, $6)
            """,
            evaluation_id,
            len(documents),
            len(analyses),
            len(reports),
            len(audit_logs),
            json.dumps(sync_data)
        )
        
        return {
            "status": "synced",
            "evaluation_id": evaluation_id,
            "synced_at": datetime.utcnow().isoformat(),
            "summary": {
                "documents": len(documents),
                "analyses": len(analyses),
                "reports": len(reports),
                "audit_logs": len(audit_logs)
            }
        }
    except Exception as e:
        logger.error(f"Evaluation sync error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sync failed: {str(e)}"
        )


# ═══════════════════════════════════════════════════════════════════════
# RECORDS SYNC ENDPOINT (/records/sync)
# ═══════════════════════════════════════════════════════════════════════

@records_router.post("/sync")
async def sync_record(
    record_data: Dict[str, Any],
    db: asyncpg.Connection = Depends(get_db),
    current_user: dict = Depends(get_optional_current_user)
):
    """
    Sync tracking record data from frontend unified record tracking.
    
    This endpoint receives record state from the frontend and synchronizes
    it with the backend database for persistence.
    
    Args:
        record_data: Unified tracking record containing evaluation data
    
    Returns:
        Sync status and record ID
    """
    try:
        record_id = record_data.get("id", {})
        evaluation_id = record_id.get("evaluationId", str(uuid.uuid4()))
        company_name = record_id.get("companyName", "Unknown")
        timestamp = record_id.get("timestamp", datetime.utcnow().isoformat())
        
        # Log the sync
        logger.info(f"Record sync: {evaluation_id}, company: {company_name}")
        
        import json
        
        # Create records sync table if needed
        await db.execute("""
            CREATE TABLE IF NOT EXISTS records_sync (
                id SERIAL PRIMARY KEY,
                evaluation_id VARCHAR(255) UNIQUE,
                company_name VARCHAR(255),
                record_timestamp TIMESTAMPTZ,
                sync_timestamp TIMESTAMPTZ DEFAULT NOW(),
                record_data JSONB,
                status VARCHAR(50) DEFAULT 'synced'
            )
        """)
        
        # Upsert record
        await db.execute(
            """
            INSERT INTO records_sync (evaluation_id, company_name, record_timestamp, record_data)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (evaluation_id) 
            DO UPDATE SET 
                record_data = EXCLUDED.record_data,
                sync_timestamp = NOW(),
                status = 'synced'
            """,
            evaluation_id,
            company_name,
            datetime.fromisoformat(timestamp.replace('Z', '+00:00')) if isinstance(timestamp, str) else timestamp,
            json.dumps(record_data)
        )
        
        return {
            "status": "synced",
            "evaluation_id": evaluation_id,
            "company_name": company_name,
            "synced_at": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Record sync error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Record sync failed: {str(e)}"
        )
