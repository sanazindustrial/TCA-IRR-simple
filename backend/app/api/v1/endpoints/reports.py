"""
Reports API Endpoints
Handles report creation, retrieval, updating, and versioning
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
import asyncpg
import logging

from app.db.database import get_db
from app.core.dependencies import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["Reports"])


# Pydantic Models
class UserInfo(BaseModel):
    """User information for report"""
    name: str
    email: str


class ReportCreate(BaseModel):
    """Create report request"""
    company_name: str = Field(..., description="Company name")
    company_id: Optional[int] = None
    report_type: str = Field(default="Triage", description="Report type")
    overall_score: Optional[float] = Field(None, ge=0, le=10)
    tca_score: Optional[float] = Field(None, ge=0, le=10)
    confidence: Optional[float] = Field(None, ge=0, le=100)
    recommendation: Optional[str] = None
    module_scores: Optional[Dict[str, Any]] = None
    analysis_data: Optional[Dict[str, Any]] = None
    settings_version_id: Optional[int] = None
    simulation_run_id: Optional[int] = None
    missing_sections: Optional[List[str]] = None


class ReportUpdate(BaseModel):
    """Update report request"""
    status: Optional[str] = None
    approval_status: Optional[str] = None
    overall_score: Optional[float] = Field(None, ge=0, le=10)
    tca_score: Optional[float] = Field(None, ge=0, le=10)
    confidence: Optional[float] = Field(None, ge=0, le=100)
    recommendation: Optional[str] = None
    reviewer_notes: Optional[str] = None
    change_reason: Optional[str] = None


class ReportResponse(BaseModel):
    """Report response model"""
    id: int
    company_name: str
    company_id: Optional[int] = None
    type: str
    status: str
    approval: str
    score: Optional[float] = None
    tca_score: Optional[float] = None
    confidence: Optional[float] = None
    recommendation: Optional[str] = None
    module_scores: Optional[Dict[str, Any]] = None
    settings_version_id: Optional[int] = None
    simulation_run_id: Optional[int] = None
    missing_sections: Optional[List[str]] = None
    user: UserInfo
    reviewer_notes: Optional[str] = None
    created_at: str
    updated_at: str
    completed_at: Optional[str] = None


class ReportVersionResponse(BaseModel):
    """Report version response"""
    id: int
    report_id: int
    version_number: int
    overall_score: Optional[float] = None
    tca_score: Optional[float] = None
    confidence: Optional[float] = None
    module_scores: Optional[Dict[str, Any]] = None
    change_reason: Optional[str] = None
    changed_by: Optional[int] = None
    created_at: str


class ReportStatsResponse(BaseModel):
    """Report statistics response"""
    total_reports: int
    completed: int
    pending: int
    due_diligence: int
    average_score: Optional[float] = None


def record_to_response(record: asyncpg.Record) -> Dict[str, Any]:
    """Convert database record to response dict"""
    # Handle metadata JSON field for extended attributes
    metadata = record.get("metadata") or {}
    if isinstance(metadata, str):
        import json
        try:
            metadata = json.loads(metadata)
        except:
            metadata = {}
    
    return {
        "id": record["id"],
        "company_name": metadata.get("company_name") or record.get("title") or "Unknown Company",
        "company_id": record.get("company_id"),
        "type": record.get("report_type") or "Triage",
        "status": record.get("status") or "Pending",
        "approval": metadata.get("approval_status") or "Pending",
        "score": float(metadata.get("overall_score")) if metadata.get("overall_score") else None,
        "tca_score": float(metadata.get("tca_score")) if metadata.get("tca_score") else None,
        "confidence": float(metadata.get("confidence")) if metadata.get("confidence") else None,
        "recommendation": metadata.get("recommendation"),
        "module_scores": metadata.get("module_scores"),
        "settings_version_id": metadata.get("settings_version_id"),
        "simulation_run_id": metadata.get("simulation_run_id"),
        "missing_sections": metadata.get("missing_sections"),
        "user": {
            "name": record.get("user_name") or record.get("username") or "Unknown",
            "email": record.get("user_email") or record.get("email") or "unknown@tca.com"
        },
        "reviewer_notes": metadata.get("reviewer_notes"),
        "created_at": record["generated_at"].strftime("%m/%d/%Y") if record.get("generated_at") else None,
        "updated_at": record["generated_at"].strftime("%m/%d/%Y") if record.get("generated_at") else None,
        "completed_at": record["generated_at"].strftime("%m/%d/%Y") if record.get("generated_at") and record.get("status") == "Completed" else None
    }


@router.get("", response_model=List[ReportResponse])
async def get_reports(
    status: Optional[str] = None,
    report_type: Optional[str] = None,
    company_name: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Get all reports with optional filtering
    """
    try:
        query = """
            SELECT 
                r.*,
                u.username as user_name,
                u.email as user_email,
                c.name as company_name_from_company
            FROM reports r
            LEFT JOIN users u ON r.generated_by = u.id
            LEFT JOIN companies c ON r.company_id = c.id
            WHERE 1=1
        """
        params = []
        param_count = 0
        
        if status:
            param_count += 1
            query += f" AND r.status = ${param_count}"
            params.append(status)
        
        if report_type:
            param_count += 1
            query += f" AND r.report_type = ${param_count}"
            params.append(report_type)
        
        if company_name:
            param_count += 1
            query += f" AND (r.title ILIKE ${param_count} OR c.name ILIKE ${param_count})"
            params.append(f"%{company_name}%")
        
        if user_id:
            param_count += 1
            query += f" AND r.generated_by = ${param_count}"
            params.append(user_id)
        
        query += " ORDER BY r.generated_at DESC NULLS LAST"
        
        param_count += 1
        query += f" LIMIT ${param_count}"
        params.append(limit)
        
        param_count += 1
        query += f" OFFSET ${param_count}"
        params.append(offset)
        
        records = await db.fetch(query, *params)
        
        return [record_to_response(record) for record in records]
        
    except Exception as e:
        logger.error(f"Error fetching reports: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch reports: {str(e)}")


@router.get("/stats", response_model=ReportStatsResponse)
async def get_report_stats(
    user_id: Optional[int] = None,
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Get report statistics
    """
    try:
        base_filter = "WHERE 1=1"
        params = []
        
        if user_id:
            base_filter += " AND generated_by = $1"
            params.append(user_id)
        
        stats = await db.fetchrow(f"""
            SELECT 
                COUNT(*) as total_reports,
                COUNT(*) FILTER (WHERE status = 'Completed') as completed,
                COUNT(*) FILTER (WHERE status = 'Pending' OR status IS NULL) as pending,
                COUNT(*) FILTER (WHERE report_type = 'Due Diligence') as due_diligence
            FROM reports
            {base_filter}
        """, *params)
        
        return ReportStatsResponse(
            total_reports=stats["total_reports"] or 0,
            completed=stats["completed"] or 0,
            pending=stats["pending"] or 0,
            due_diligence=stats["due_diligence"] or 0,
            average_score=None
        )
        
    except Exception as e:
        logger.error(f"Error fetching report stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: int,
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Get a specific report by ID
    """
    try:
        record = await db.fetchrow("""
            SELECT 
                r.*,
                u.username as user_name,
                u.email as user_email,
                c.name as company_name_from_company
            FROM reports r
            LEFT JOIN users u ON r.generated_by = u.id
            LEFT JOIN companies c ON r.company_id = c.id
            WHERE r.id = $1
        """, report_id)
        
        if not record:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return record_to_response(record)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching report {report_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch report: {str(e)}")


@router.post("", response_model=ReportResponse)
async def create_report(
    report: ReportCreate,
    user_id: int = Query(1, description="User ID creating the report"),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Create a new report
    """
    try:
        import json
        
        # Store extended attributes in metadata JSON
        metadata = {
            "company_name": report.company_name,
            "overall_score": report.overall_score,
            "tca_score": report.tca_score,
            "confidence": report.confidence,
            "recommendation": report.recommendation,
            "module_scores": report.module_scores,
            "analysis_data": report.analysis_data,
            "settings_version_id": report.settings_version_id,
            "simulation_run_id": report.simulation_run_id,
            "missing_sections": report.missing_sections,
            "approval_status": "Pending"
        }
        
        record = await db.fetchrow("""
            INSERT INTO reports (
                company_id, report_type, title, status, 
                generated_at, user_id, metadata
            ) VALUES (
                $1, $2, $3, 'Completed',
                NOW(), $4, $5
            )
            RETURNING *
        """,
            report.company_id,
            report.report_type,
            report.company_name,  # Use company_name as title
            user_id,
            json.dumps(metadata)
        )
        
        # Fetch with user info
        full_record = await db.fetchrow("""
            SELECT 
                r.*,
                u.username as user_name,
                u.email as user_email,
                c.name as company_name_from_company
            FROM reports r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN companies c ON r.company_id = c.id
            WHERE r.id = $1
        """, record["id"])
        
        return record_to_response(full_record)
        
    except Exception as e:
        logger.error(f"Error creating report: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create report: {str(e)}")


@router.put("/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: int,
    report: ReportUpdate,
    user_id: int = Query(1, description="User ID updating the report"),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Update a report - simplified to work with actual schema
    """
    try:
        import json
        
        # Get current report
        current = await db.fetchrow("SELECT * FROM reports WHERE id = $1", report_id)
        if not current:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Update metadata with new values
        current_metadata = current.get("metadata") or {}
        if isinstance(current_metadata, str):
            try:
                current_metadata = json.loads(current_metadata)
            except:
                current_metadata = {}
        
        # Update metadata fields
        if report.approval_status is not None:
            current_metadata["approval_status"] = report.approval_status
        if report.overall_score is not None:
            current_metadata["overall_score"] = report.overall_score
        if report.tca_score is not None:
            current_metadata["tca_score"] = report.tca_score
        if report.confidence is not None:
            current_metadata["confidence"] = report.confidence
        if report.recommendation is not None:
            current_metadata["recommendation"] = report.recommendation
        if report.reviewer_notes is not None:
            current_metadata["reviewer_notes"] = report.reviewer_notes
            current_metadata["reviewed_by"] = user_id
        if report.change_reason:
            current_metadata["change_reason"] = report.change_reason
        
        # Build update query
        updates = ["metadata = $2"]
        params = [report_id, json.dumps(current_metadata)]
        param_idx = 3
        
        if report.status is not None:
            updates.append(f"status = ${param_idx}")
            params.append(report.status)
            param_idx += 1
        
        query = f"UPDATE reports SET {', '.join(updates)} WHERE id = $1"
        await db.execute(query, *params)
        
        # Fetch updated record
        record = await db.fetchrow("""
            SELECT 
                r.*,
                u.username as user_name,
                u.email as user_email,
                c.name as company_name_from_company
            FROM reports r
            LEFT JOIN users u ON r.generated_by = u.id
            LEFT JOIN companies c ON r.company_id = c.id
            WHERE r.id = $1
        """, report_id)
        
        return record_to_response(record)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating report {report_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update report: {str(e)}")


@router.get("/{report_id}/versions", response_model=List[ReportVersionResponse])
async def get_report_versions(
    report_id: int,
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Get all versions of a report
    """
    try:
        records = await db.fetch("""
            SELECT * FROM report_versions
            WHERE report_id = $1
            ORDER BY version_number DESC
        """, report_id)
        
        return [
            ReportVersionResponse(
                id=r["id"],
                report_id=r["report_id"],
                version_number=r["version_number"],
                overall_score=float(r["overall_score"]) if r.get("overall_score") else None,
                tca_score=float(r["tca_score"]) if r.get("tca_score") else None,
                confidence=float(r["confidence"]) if r.get("confidence") else None,
                module_scores=r.get("module_scores"),
                change_reason=r.get("change_reason"),
                changed_by=r.get("changed_by"),
                created_at=r["created_at"].isoformat() if r.get("created_at") else None
            )
            for r in records
        ]
        
    except Exception as e:
        logger.error(f"Error fetching report versions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch versions: {str(e)}")


@router.delete("/{report_id}")
async def delete_report(
    report_id: int,
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Delete a report
    """
    try:
        result = await db.execute("DELETE FROM reports WHERE id = $1", report_id)
        
        if result == "DELETE 0":
            raise HTTPException(status_code=404, detail="Report not found")
        
        return {"message": "Report deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting report {report_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete report: {str(e)}")
