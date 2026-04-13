"""
Company management endpoints
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Optional
from datetime import datetime
import asyncpg
from pydantic import BaseModel, Field

from app.db import get_db
from app.models import CompanyResponse, CompanyCreate, CompanyUpdate, PaginatedResponse
from .auth import get_current_user, get_optional_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


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
        
        # Get total count
        total = await db.fetchval("SELECT COUNT(*) FROM companies")
        
        # Get paginated companies
        rows = await db.fetch(
            """SELECT id, name, description, website, industry, stage, 
                      location, founded_year, employee_count, created_at, 
                      updated_at, created_by
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
        
        # Insert into database using correct column names
        row = await db.fetchrow(
            """INSERT INTO companies 
               (name, description, website, sector, funding_stage, location, 
                founded_year, employees_count, metadata, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
               RETURNING id, name, description, website, sector, funding_stage, 
                         location, founded_year, employees_count, metadata, 
                         created_at, updated_at""",
            name, description, company_data.website, industry, stage,
            location, company_data.founded_year, employee_count, json.dumps(metadata)
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
        row = await db.fetchrow(
            """SELECT id, name, description, website, industry, stage, 
                      location, founded_year, employee_count, created_at, 
                      updated_at, created_by
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