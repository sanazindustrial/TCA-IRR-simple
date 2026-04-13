"""
Role Permissions Models
Pydantic models for role configuration management
"""

from datetime import datetime
from typing import List, Optional, Union
from pydantic import BaseModel, Field


class RolePermission(BaseModel):
    """Single permission definition for a role"""
    id: Optional[int] = None
    name: str = Field(..., description="Permission identifier")
    description: Optional[str] = Field(None,
                                       description="Permission description")
    enabled: bool = Field(True, description="Whether permission is granted")


class RoleLimits(BaseModel):
    """Report limits for a role"""
    triageReports: Union[int, str] = Field(
        ..., description="Max triage reports (number or 'Unlimited')")
    ddReports: Union[int, str] = Field(
        ..., description="Max DD reports (number or 'Unlimited')")


class RoleConfig(BaseModel):
    """Full role configuration"""
    roleKey: str = Field(...,
                         description="Role identifier (admin, analyst, user)")
    label: str = Field(..., description="Display label")
    icon: str = Field("User", description="Icon name")
    color: str = Field("text-gray-600", description="Text color class")
    bgColor: str = Field("bg-gray-100", description="Background color class")
    permissions: List[RolePermission] = Field(default_factory=list)
    limits: RoleLimits


class RoleConfigUpdate(BaseModel):
    """Update payload for role configuration"""
    label: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    bgColor: Optional[str] = None
    permissions: Optional[List[RolePermission]] = None
    limits: Optional[RoleLimits] = None


class RoleConfigResponse(BaseModel):
    """Response with all role configurations"""
    roles: dict  # { admin: RoleConfig, analyst: RoleConfig, user: RoleConfig }
    updatedAt: Optional[datetime] = None


class RoleConfigCreateRequest(BaseModel):
    """Request to create or update multiple role configurations"""
    roles: dict  # { admin: RoleConfigUpdate, ... }
