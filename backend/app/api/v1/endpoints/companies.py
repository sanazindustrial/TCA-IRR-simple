"""
Company management endpoints
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Optional, Set
from datetime import datetime
import asyncpg
from pydantic import BaseModel, Field

from app.db import get_db
from app.models import CompanyResponse, CompanyCreate, CompanyUpdate, PaginatedResponse
from .auth import get_current_user, get_optional_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


async def _get_table_columns(db: asyncpg.Connection, table_name: str) -> Set[str]:
    rows = await db.fetch(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1
        """,
        table_name,
    )
    return {row["column_name"] for row in rows}


def _first_available(columns: Set[str], *candidates: str) -> Optional[str]:
    for candidate in candidates:
        if candidate in columns:
            return candidate
    return None


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

        name_column = _first_available(columns, "name", "company_name") or "NULL"
        description_column = _first_available(columns, "description") or "NULL"
        website_column = _first_available(columns, "website") or "NULL"
        industry_column = _first_available(columns, "industry", "sector", "industry_vertical") or "NULL"
        stage_column = _first_available(columns, "stage", "funding_stage", "development_stage") or "NULL"
        location_column = _first_available(columns, "location") or "NULL"
        founded_year_column = _first_available(columns, "founded_year") or "NULL"
        employee_count_column = _first_available(columns, "employee_count", "employees_count", "number_of_employees") or "NULL"
        created_at_column = _first_available(columns, "created_at") or "NOW()"
        updated_at_column = _first_available(columns, "updated_at") or "NULL"
        created_by_column = _first_available(columns, "created_by") or "NULL"
        
        # Get total count
        total = await db.fetchval("SELECT COUNT(*) FROM companies")
        
        # Get paginated companies
        rows = await db.fetch(
            f"""SELECT id,
                      {name_column} AS name,
                      {description_column} AS description,
                      {website_column} AS website,
                      {industry_column} AS industry,
                      {stage_column} AS stage,
                      {location_column} AS location,
                      {founded_year_column} AS founded_year,
                      {employee_count_column} AS employee_count,
                      {created_at_column} AS created_at,
                      {updated_at_column} AS updated_at,
                      {created_by_column} AS created_by
               FROM companies 
               ORDER BY created_at DESC 
               LIMIT $1 OFFSET $2""",
            size, offset
        )
        
        items = [dict(row) for row in rows]
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

        insert_columns = []
        insert_values = []

        def add_column(column_name: str, value):
            if column_name in columns:
                insert_columns.append(column_name)
                insert_values.append(value)

        add_column("name", name)
        add_column("company_name", name)
        add_column("description", description)
        add_column("website", company_data.website)
        add_column("industry", industry)
        add_column("sector", industry)
        add_column("industry_vertical", industry)
        add_column("stage", stage)
        add_column("funding_stage", stage)
        add_column("development_stage", stage)
        add_column("location", location)
        add_column("founded_year", company_data.founded_year)
        add_column("employee_count", employee_count)
        add_column("employees_count", employee_count)
        add_column("number_of_employees", employee_count)
        add_column("metadata", json.dumps(metadata) if metadata else None)

        if not insert_columns:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No compatible company columns found"
            )

        placeholders = [f"${i}" for i in range(1, len(insert_values) + 1)]
        returning_columns = [
            "id",
            _first_available(columns, "name", "company_name") or "NULL",
            _first_available(columns, "description") or "NULL",
            _first_available(columns, "website") or "NULL",
            _first_available(columns, "industry", "sector", "industry_vertical") or "NULL",
            _first_available(columns, "stage", "funding_stage", "development_stage") or "NULL",
            _first_available(columns, "location") or "NULL",
            _first_available(columns, "founded_year") or "NULL",
            _first_available(columns, "employee_count", "employees_count", "number_of_employees") or "NULL",
            _first_available(columns, "metadata") or "NULL",
            _first_available(columns, "created_at") or "NOW()",
            _first_available(columns, "updated_at") or "NULL",
        ]
        
        row = await db.fetchrow(
            f"""INSERT INTO companies ({', '.join(insert_columns)})
                VALUES ({', '.join(placeholders)})
                RETURNING {', '.join(returning_columns)}""",
            *insert_values
        )
        
        if row:
            logger.info(f"Created company: {name} (id={row['id']})")
            return dict(row)
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
        row = await db.fetchrow(
            f"""SELECT id,
                      {_first_available(columns, "name", "company_name") or 'NULL'} AS name,
                      {_first_available(columns, "description") or 'NULL'} AS description,
                      {_first_available(columns, "website") or 'NULL'} AS website,
                      {_first_available(columns, "industry", "sector", "industry_vertical") or 'NULL'} AS industry,
                      {_first_available(columns, "stage", "funding_stage", "development_stage") or 'NULL'} AS stage,
                      {_first_available(columns, "location") or 'NULL'} AS location,
                      {_first_available(columns, "founded_year") or 'NULL'} AS founded_year,
                      {_first_available(columns, "employee_count", "employees_count", "number_of_employees") or 'NULL'} AS employee_count,
                      {_first_available(columns, "created_at") or 'NOW()'} AS created_at,
                      {_first_available(columns, "updated_at") or 'NULL'} AS updated_at,
                      {_first_available(columns, "created_by") or 'NULL'} AS created_by
               FROM companies WHERE id = $1""",
            company_id
        )
        if row:
            return dict(row)
        raise HTTPException(status_code=404, detail="Company not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching company {company_id}: {e}")
        raise HTTPException(status_code=500, detail="Database error")