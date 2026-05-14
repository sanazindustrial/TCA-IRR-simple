"""
Company management endpoints
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Any, Dict, List, Optional
from datetime import datetime
import asyncpg
from pydantic import BaseModel, Field

from app.db import get_db
from app.models import CompanyResponse, CompanyCreate, CompanyUpdate, PaginatedResponse
from .auth import get_current_user, get_optional_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


async def _get_table_columns(db: asyncpg.Connection, table_name: str) -> List[str]:
    rows = await db.fetch(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = $1
        ORDER BY ordinal_position
        """,
        table_name,
    )
    return [row["column_name"] for row in rows]


def _choose_first_available(columns: List[str], candidates: List[str]) -> Optional[str]:
    for candidate in candidates:
        if candidate in columns:
            return candidate
    return None


def _row_to_company_response(row: Dict[str, Any]) -> Dict[str, Any]:
    company = dict(row)
    company["industry"] = company.get("industry") or company.get("sector")
    company["stage"] = company.get("stage") or company.get("funding_stage")
    company["employee_count"] = company.get("employee_count") or company.get("employees_count")
    company["created_by"] = company.get("created_by") or 0
    return company


# Flexible schema that accepts frontend field names
class CompanyCreateFlexible(BaseModel):
    """Flexible company creation model accepting various field names"""
    # Accept both 'name' and 'company_name'
    name: Optional[str] = Field(None, max_length=200)
    company_name: Optional[str] = Field(None, max_length=200)
    legal_name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    website: Optional[str] = None
    one_line_description: Optional[str] = Field(None, max_length=500)
    product_description: Optional[str] = Field(None, max_length=2000)
    industry_vertical: Optional[str] = Field(None, max_length=100)
    development_stage: Optional[str] = Field(None, max_length=50)
    business_model: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    city: Optional[str] = Field(None, max_length=100)
    number_of_employees: Optional[int] = Field(None, ge=0)
    framework: Optional[str] = Field(None, max_length=50)
    # Standard fields
    industry: Optional[str] = Field(None, max_length=100)
    stage: Optional[str] = None
    location: Optional[str] = Field(None, max_length=200)
    founded_year: Optional[int] = Field(None, ge=1800, le=2100)
    employee_count: Optional[int] = Field(None, ge=0)

    def get_name(self) -> str:
        """Get company name from either field"""
        return self.company_name or self.name or "Unknown Company"


@router.get("/", response_model=PaginatedResponse)
async def get_companies(page: int = 1,
                        size: int = 20,
                        db: asyncpg.Connection = Depends(get_db),
                        current_user: dict = Depends(get_current_user)):
    """Get paginated list of companies"""
    try:
        offset = (page - 1) * size
        columns = await _get_table_columns(db, "companies")

        industry_column = _choose_first_available(columns, ["industry", "sector"])
        stage_column = _choose_first_available(columns, ["stage", "funding_stage"])
        employee_count_column = _choose_first_available(columns, ["employee_count", "employees_count"])
        created_by_column = _choose_first_available(columns, ["created_by"])
        metadata_column = _choose_first_available(columns, ["metadata"])
        sort_column = _choose_first_available(columns, ["created_at", "updated_at", "id"])

        select_columns = [
            "id",
            "name",
            "description",
            "website",
            f"{industry_column} AS industry" if industry_column else "NULL AS industry",
            f"{stage_column} AS stage" if stage_column else "NULL AS stage",
            "location",
            "founded_year",
            f"{employee_count_column} AS employee_count" if employee_count_column else "NULL AS employee_count",
            "created_at",
            "updated_at",
        ]

        if created_by_column:
            select_columns.append(f"{created_by_column} AS created_by")
        elif metadata_column:
            select_columns.append("COALESCE((metadata->>'created_by')::int, 0) AS created_by")
        else:
            select_columns.append("0 AS created_by")
        
        # Get total count
        total_value = await db.fetchval("SELECT COUNT(*) FROM companies")
        total = int(total_value or 0)
        
        # Get paginated companies
        rows = await db.fetch(
            f"""SELECT {', '.join(select_columns)}
               FROM companies 
               ORDER BY {sort_column or 'id'} DESC 
               LIMIT $1 OFFSET $2""",
            size, offset
        )
        
        items = [_row_to_company_response(dict(row)) for row in rows]
        pages = (total + size - 1) // size if size > 0 else 0
        
        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=pages,
            has_next=page < pages,
            has_previous=page > 1
        )
    except Exception as e:
        logger.error(f"Error fetching companies: {e}")
        return PaginatedResponse(items=[], total=0, page=page, size=size, pages=0, has_next=False, has_previous=False)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_company(
    company_data: CompanyCreateFlexible,
    db: asyncpg.Connection = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user)
):
    """Create a new company. Authentication is optional for analysis workflows."""
    try:
        columns = await _get_table_columns(db, "companies")

        # Get the company name from either field
        name = company_data.get_name()
        
        # Determine who created it
        created_by = current_user['id'] if current_user else None
        
        # Build location from individual fields if not provided
        location = company_data.location
        if not location and any([company_data.city, company_data.state, company_data.country]):
            parts = [p for p in [company_data.city, company_data.state, company_data.country] if p]
            location = ", ".join(parts)
        
        # Map industry
        industry = company_data.industry or company_data.industry_vertical
        
        # Map stage
        stage = company_data.stage or company_data.development_stage
        
        # Map employee count
        employee_count = company_data.employee_count or company_data.number_of_employees
        
        # Combine descriptions
        description = company_data.description
        if not description:
            parts = []
            if company_data.one_line_description:
                parts.append(company_data.one_line_description)
            if company_data.product_description:
                parts.append(company_data.product_description)
            description = " | ".join(parts) if parts else None
        
        # Store created_by in metadata since it's not a direct column
        import json
        metadata = {"created_by": created_by} if created_by else {}
        
        industry_column = _choose_first_available(columns, ["industry", "sector"])
        stage_column = _choose_first_available(columns, ["stage", "funding_stage"])
        employee_count_column = _choose_first_available(columns, ["employee_count", "employees_count"])
        created_by_column = _choose_first_available(columns, ["created_by"])
        metadata_column = _choose_first_available(columns, ["metadata"])
        created_at_column = _choose_first_available(columns, ["created_at"])
        updated_at_column = _choose_first_available(columns, ["updated_at"])

        insert_columns: List[str] = []
        insert_values: List[str] = []
        insert_params: List[Any] = []

        def add_param_column(column: str, value: Any) -> None:
            if column in columns:
                insert_columns.append(column)
                insert_params.append(value)
                insert_values.append(f"${len(insert_params)}")

        def add_now_column(column: str) -> None:
            if column in columns:
                insert_columns.append(column)
                insert_values.append("NOW()")

        add_param_column("name", name)
        add_param_column("description", description)
        add_param_column("website", company_data.website)
        if industry_column:
            add_param_column(industry_column, industry)
        if stage_column:
            add_param_column(stage_column, stage)
        add_param_column("location", location)
        add_param_column("founded_year", company_data.founded_year)
        if employee_count_column:
            add_param_column(employee_count_column, employee_count)
        if created_by_column:
            add_param_column(created_by_column, created_by)
        elif metadata_column and created_by is not None:
            metadata = {"created_by": created_by}
            add_param_column(metadata_column, json.dumps(metadata))
        elif metadata_column:
            add_param_column(metadata_column, json.dumps(metadata))
        add_now_column(created_at_column or "")
        add_now_column(updated_at_column or "")

        if not insert_columns:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No compatible company columns available",
            )

        returning_columns = [
            "id",
            "name",
            "description",
            "website",
            f"{industry_column} AS industry" if industry_column else "NULL AS industry",
            f"{stage_column} AS stage" if stage_column else "NULL AS stage",
            "location",
            "founded_year",
            f"{employee_count_column} AS employee_count" if employee_count_column else "NULL AS employee_count",
            "created_at" if created_at_column else "NOW() AS created_at",
            "updated_at" if updated_at_column else "NOW() AS updated_at",
            f"{created_by_column} AS created_by" if created_by_column else ("COALESCE((metadata->>'created_by')::int, 0) AS created_by" if metadata_column else "0 AS created_by"),
        ]

        row = await db.fetchrow(
            f"""INSERT INTO companies 
               ({', '.join(insert_columns)})
               VALUES ({', '.join(insert_values)})
               RETURNING {', '.join(returning_columns)}""",
            *insert_params
        )
        
        if row:
            logger.info(f"Created company: {name} (id={row['id']})")
            return _row_to_company_response(dict(row))
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create company"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating company: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create company: {str(e)}"
        )


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: int,
                      db: asyncpg.Connection = Depends(get_db),
                      current_user: dict = Depends(get_current_user)):
    """Get company by ID"""
    try:
        columns = await _get_table_columns(db, "companies")
        industry_column = _choose_first_available(columns, ["industry", "sector"])
        stage_column = _choose_first_available(columns, ["stage", "funding_stage"])
        employee_count_column = _choose_first_available(columns, ["employee_count", "employees_count"])
        created_by_column = _choose_first_available(columns, ["created_by"])
        metadata_column = _choose_first_available(columns, ["metadata"])

        select_columns = [
            "id",
            "name",
            "description",
            "website",
            f"{industry_column} AS industry" if industry_column else "NULL AS industry",
            f"{stage_column} AS stage" if stage_column else "NULL AS stage",
            "location",
            "founded_year",
            f"{employee_count_column} AS employee_count" if employee_count_column else "NULL AS employee_count",
            "created_at",
            "updated_at",
        ]
        if created_by_column:
            select_columns.append(f"{created_by_column} AS created_by")
        elif metadata_column:
            select_columns.append("COALESCE((metadata->>'created_by')::int, 0) AS created_by")
        else:
            select_columns.append("0 AS created_by")

        row = await db.fetchrow(
            f"""SELECT {', '.join(select_columns)}
               FROM companies WHERE id = $1""",
            company_id
        )
        if row:
            return _row_to_company_response(dict(row))
        raise HTTPException(status_code=404, detail="Company not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching company {company_id}: {e}")
        raise HTTPException(status_code=500, detail="Database error")