"""
Reports API Endpoints
Handles report creation, retrieval, updating, and versioning
"""

from typing import List, Optional, Dict, Any, Set
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
    evaluation_id: Optional[str] = None
    analysis_id: Optional[str] = None
    report_id: Optional[str] = None
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
    analysis_data: Optional[Dict[str, Any]] = None
    evaluation_id: Optional[str] = None
    analysis_id: Optional[str] = None
    report_id: Optional[str] = None
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


async def _get_reports_table_columns(db: asyncpg.Connection) -> Set[str]:
    """Get reports table columns for schema compatibility across environments."""
    rows = await db.fetch(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'reports'
        """
    )
    return {row["column_name"] for row in rows}


async def _resolve_valid_user_id(db: asyncpg.Connection, requested_user_id: Optional[int]) -> Optional[int]:
    """Return a valid user id for FK-constrained columns, or None if unavailable."""
    if requested_user_id is None:
        return None

    try:
        exists = await db.fetchval("SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)", requested_user_id)
        return requested_user_id if exists else None
    except Exception:
        # If user lookup fails due schema/environment differences, avoid FK violation by omitting user link.
        return None


def _choose_first_available(columns: Set[str], candidates: List[str]) -> Optional[str]:
    for candidate in candidates:
        if candidate in columns:
            return candidate
    return None


def _safe_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _build_report_select_query(user_join_column: Optional[str]) -> str:
    user_join = (
        f"LEFT JOIN users u ON r.{user_join_column} = u.id"
        if user_join_column
        else "LEFT JOIN users u ON 1 = 0"
    )
    return f"""
        SELECT
            r.*,
            u.username as user_name,
            u.email as user_email,
            c.name as company_name_from_company
        FROM reports r
        {user_join}
        LEFT JOIN companies c ON r.company_id = c.id
    """


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
    
    company_name = (
        metadata.get("company_name")
        or record.get("company_name")
        or record.get("title")
        or record.get("company_name_from_company")
        or "Unknown Company"
    )
    created_at_dt = record.get("generated_at") or record.get("created_at")
    updated_at_dt = record.get("updated_at") or created_at_dt
    status = record.get("status") or "Pending"

    return {
        "id": record["id"],
        "company_name": company_name,
        "company_id": record.get("company_id"),
        "type": record.get("report_type") or "Triage",
        "status": status,
        "approval": metadata.get("approval_status") or record.get("approval_status") or "Pending",
        "score": _safe_float(metadata.get("overall_score") or record.get("overall_score")),
        "tca_score": _safe_float(metadata.get("tca_score") or record.get("tca_score")),
        "confidence": _safe_float(metadata.get("confidence") or record.get("confidence")),
        "recommendation": metadata.get("recommendation") or record.get("recommendation"),
        "module_scores": metadata.get("module_scores") or record.get("module_scores"),
        "analysis_data": metadata.get("analysis_data") or record.get("analysis_data"),
        "evaluation_id": metadata.get("evaluation_id") or record.get("evaluation_id"),
        "analysis_id": metadata.get("analysis_id") or record.get("analysis_id"),
        "report_id": metadata.get("report_id") or record.get("report_id"),
        "settings_version_id": metadata.get("settings_version_id") or record.get("settings_version_id"),
        "simulation_run_id": metadata.get("simulation_run_id") or record.get("simulation_run_id"),
        "missing_sections": metadata.get("missing_sections") or record.get("missing_sections"),
        "user": {
            "name": record.get("user_name") or record.get("username") or "Unknown",
            "email": record.get("user_email") or record.get("email") or "unknown@tca.com"
        },
        "reviewer_notes": metadata.get("reviewer_notes") or record.get("reviewer_notes"),
        "created_at": created_at_dt.strftime("%m/%d/%Y") if created_at_dt else "",
        "updated_at": updated_at_dt.strftime("%m/%d/%Y") if updated_at_dt else "",
        "completed_at": created_at_dt.strftime("%m/%d/%Y") if created_at_dt and status == "Completed" else None
    }


@router.get("", response_model=List[ReportResponse])
async def get_reports(
    status: Optional[str] = None,
    report_type: Optional[str] = None,
    company_name: Optional[str] = None,
    evaluation_id: Optional[str] = None,
    analysis_id: Optional[str] = None,
    report_id: Optional[str] = None,
    user_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: asyncpg.Connection = Depends(get_db)
):
    """
    Get all reports with optional filtering
    """
    try:
        columns = await _get_reports_table_columns(db)
        user_column = _choose_first_available(columns, ["generated_by", "created_by", "user_id"])
        report_type_column = _choose_first_available(columns, ["report_type"])
        status_column = _choose_first_available(columns, ["status"])
        company_text_column = _choose_first_available(columns, ["company_name", "title"])
        sort_column = _choose_first_available(columns, ["generated_at", "created_at", "id"])

        query = _build_report_select_query(user_column) + " WHERE 1=1"
        params = []
        param_count = 0
        
        if status and status_column:
            param_count += 1
            query += f" AND r.{status_column} = ${param_count}"
            params.append(status)
        
        if report_type and report_type_column:
            param_count += 1
            query += f" AND r.{report_type_column} = ${param_count}"
            params.append(report_type)
        
        if company_name:
            param_count += 1
            if company_text_column:
                query += f" AND (r.{company_text_column} ILIKE ${param_count} OR c.name ILIKE ${param_count})"
            else:
                query += f" AND c.name ILIKE ${param_count}"
            params.append(f"%{company_name}%")
        
        if user_id and user_column:
            param_count += 1
            query += f" AND r.{user_column} = ${param_count}"
            params.append(user_id)
        
        if sort_column:
            query += f" ORDER BY r.{sort_column} DESC NULLS LAST"
        else:
            query += " ORDER BY r.id DESC"
        
        param_count += 1
        query += f" LIMIT ${param_count}"
        params.append(limit)
        
        param_count += 1
        query += f" OFFSET ${param_count}"
        params.append(offset)
        
        records = await db.fetch(query, *params)
        
        responses = [record_to_response(record) for record in records]

        if evaluation_id:
            responses = [r for r in responses if str(r.get("evaluation_id") or "") == evaluation_id]
        if analysis_id:
            responses = [r for r in responses if str(r.get("analysis_id") or "") == analysis_id]
        if report_id:
            responses = [r for r in responses if str(r.get("report_id") or "") == report_id]

        return responses
        
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
        columns = await _get_reports_table_columns(db)
        user_column = _choose_first_available(columns, ["generated_by", "created_by", "user_id"])
        status_column = _choose_first_available(columns, ["status"])
        report_type_column = _choose_first_available(columns, ["report_type"])

        base_filter = "WHERE 1=1"
        params = []
        
        if user_id and user_column:
            base_filter += f" AND {user_column} = $1"
            params.append(user_id)

        completed_expr = (
            f"COUNT(*) FILTER (WHERE {status_column} = 'Completed')"
            if status_column
            else "0"
        )
        pending_expr = (
            f"COUNT(*) FILTER (WHERE {status_column} = 'Pending' OR {status_column} IS NULL)"
            if status_column
            else "0"
        )
        due_diligence_expr = (
            f"COUNT(*) FILTER (WHERE {report_type_column} = 'Due Diligence')"
            if report_type_column
            else "0"
        )
        
        stats = await db.fetchrow(f"""
            SELECT 
                COUNT(*) as total_reports,
                {completed_expr} as completed,
                {pending_expr} as pending,
                {due_diligence_expr} as due_diligence
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
        columns = await _get_reports_table_columns(db)
        user_column = _choose_first_available(columns, ["generated_by", "created_by", "user_id"])
        query = _build_report_select_query(user_column) + " WHERE r.id = $1"
        record = await db.fetchrow(query, report_id)
        
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

        columns = await _get_reports_table_columns(db)
        user_column = _choose_first_available(columns, ["generated_by", "created_by", "user_id"])
        safe_user_id = await _resolve_valid_user_id(db, user_id)
        report_type_column = _choose_first_available(columns, ["report_type"])
        company_text_column = _choose_first_available(columns, ["title", "company_name"])
        status_column = _choose_first_available(columns, ["status"])
        timestamp_column = _choose_first_available(columns, ["generated_at", "created_at"])
        
        # Store extended attributes in metadata JSON
        metadata = {
            "report_id": report.report_id,
            "evaluation_id": report.evaluation_id,
            "analysis_id": report.analysis_id,
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
        
        insert_columns: List[str] = []
        insert_values: List[str] = []
        insert_params: List[Any] = []

        def add_param_column(column: str, value: Any) -> None:
            insert_columns.append(column)
            insert_params.append(value)
            insert_values.append(f"${len(insert_params)}")

        def add_now_column(column: str) -> None:
            insert_columns.append(column)
            insert_values.append("NOW()")

        if "company_id" in columns and report.company_id is not None:
            add_param_column("company_id", report.company_id)
        if report_type_column:
            add_param_column(report_type_column, report.report_type)
        if company_text_column:
            add_param_column(company_text_column, report.company_name)
        if status_column:
            add_param_column(status_column, "Completed")
        if timestamp_column == "generated_at":
            add_now_column("generated_at")
        if user_column and safe_user_id is not None:
            add_param_column(user_column, safe_user_id)
        if "metadata" in columns:
            add_param_column("metadata", json.dumps(metadata))

        if "analysis_data" in columns and report.analysis_data is not None:
            add_param_column("analysis_data", report.analysis_data)
        if "evaluation_id" in columns and report.evaluation_id:
            add_param_column("evaluation_id", report.evaluation_id)
        if "analysis_id" in columns and report.analysis_id:
            add_param_column("analysis_id", report.analysis_id)
        if "report_id" in columns and report.report_id:
            add_param_column("report_id", report.report_id)

        if not insert_columns:
            raise HTTPException(status_code=500, detail="Reports table schema is missing expected insert columns")

        insert_sql = f"""
            INSERT INTO reports ({', '.join(insert_columns)})
            VALUES ({', '.join(insert_values)})
            RETURNING *
        """
        record = await db.fetchrow(insert_sql, *insert_params)
        
        # Fetch with user info
        full_record_query = _build_report_select_query(user_column) + " WHERE r.id = $1"
        full_record = await db.fetchrow(full_record_query, record["id"])
        
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

        columns = await _get_reports_table_columns(db)
        user_column = _choose_first_available(columns, ["generated_by", "created_by", "user_id"])
        
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
        updates: List[str] = []
        params: List[Any] = [report_id]
        param_idx = 2

        if "metadata" in columns:
            updates.append("metadata = $2")
            params.append(json.dumps(current_metadata))
            param_idx += 1
        
        if report.status is not None and "status" in columns:
            updates.append(f"status = ${param_idx}")
            params.append(report.status)
            param_idx += 1

        if report.approval_status is not None and "approval_status" in columns:
            updates.append(f"approval_status = ${param_idx}")
            params.append(report.approval_status)
            param_idx += 1

        if report.reviewer_notes is not None and "reviewer_notes" in columns:
            updates.append(f"reviewer_notes = ${param_idx}")
            params.append(report.reviewer_notes)
            param_idx += 1

        if report.overall_score is not None and "overall_score" in columns:
            updates.append(f"overall_score = ${param_idx}")
            params.append(report.overall_score)
            param_idx += 1

        if report.tca_score is not None and "tca_score" in columns:
            updates.append(f"tca_score = ${param_idx}")
            params.append(report.tca_score)
            param_idx += 1

        if report.confidence is not None and "confidence" in columns:
            updates.append(f"confidence = ${param_idx}")
            params.append(report.confidence)
            param_idx += 1

        if report.recommendation is not None and "recommendation" in columns:
            updates.append(f"recommendation = ${param_idx}")
            params.append(report.recommendation)
            param_idx += 1

        if not updates:
            record = await db.fetchrow("SELECT * FROM reports WHERE id = $1", report_id)
            return record_to_response(record)
        
        query = f"UPDATE reports SET {', '.join(updates)} WHERE id = $1"
        await db.execute(query, *params)
        
        # Fetch updated record
        updated_query = _build_report_select_query(user_column) + " WHERE r.id = $1"
        record = await db.fetchrow(updated_query, report_id)
        
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
