"""
Settings Version API Endpoints
Manage module configurations, TCA categories, and simulation runs with versioning
"""

import json
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

from app.db.database import db_manager
from app.models.settings_version import (
    SettingsVersion,
    SettingsVersionCreate,
    SettingsVersionUpdate,
    ModuleSetting,
    ModuleSettingUpdate,
    TCACategory,
    TCACategoryUpdate,
    SimulationRun,
    SimulationRunCreate,
    SimulationResult,
    DEFAULT_MODULE_SETTINGS,
    DEFAULT_TCA_CATEGORIES,
)

router = APIRouter(prefix="/settings", tags=["Settings"])


def parse_json_field(value: Any) -> dict:
    """Safely parse JSON field that may be stored as string in database."""
    if value is None:
        return {}
    if isinstance(value, dict):
        return value
    if isinstance(value, str):
        value = value.strip()
        if not value or value == '{}':
            return {}
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, dict) else {}
        except (json.JSONDecodeError, TypeError):
            return {}
    return {}


# ===== Settings Versions =====

@router.get("/versions", response_model=List[SettingsVersion])
async def get_all_settings_versions(
    include_archived: bool = Query(False, description="Include archived versions")
):
    """Get all settings versions"""
    try:
        async with db_manager.get_connection() as conn:
            query = """
                SELECT id, version_number, version_name, description, 
                       created_by, created_at, is_active, is_archived
                FROM module_settings_versions
                WHERE ($1 OR is_archived = FALSE)
                ORDER BY version_number DESC
            """
            rows = await conn.fetch(query, include_archived)
            versions = []
            for row in rows:
                version = SettingsVersion(
                    id=row['id'],
                    version_number=row['version_number'],
                    version_name=row['version_name'],
                    description=row['description'],
                    created_by=row['created_by'],
                    created_at=row['created_at'],
                    is_active=row['is_active'],
                    is_archived=row['is_archived']
                )
                versions.append(version)
            return versions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# IMPORTANT: /versions/active must come BEFORE /versions/{version_id} to avoid route collision
@router.get("/versions/active", response_model=SettingsVersion)
async def get_active_settings_version():
    """Get the currently active settings version"""
    try:
        async with db_manager.get_connection() as conn:
            row = await conn.fetchrow("""
                SELECT id FROM module_settings_versions WHERE is_active = TRUE LIMIT 1
            """)
            if not row:
                raise HTTPException(status_code=404, detail="No active settings version found")
            # Get version ID and delegate to get_settings_version
            version_id = row['id']
            
            # Get full version details
            version_row = await conn.fetchrow("""
                SELECT id, version_number, version_name, description, 
                       created_by, created_at, is_active, is_archived
                FROM module_settings_versions WHERE id = $1
            """, version_id)
            
            if not version_row:
                raise HTTPException(status_code=404, detail="Settings version not found")
            
            # Get module settings
            module_rows = await conn.fetch("""
                SELECT id, module_id, module_name, weight, is_enabled, priority, settings, thresholds
                FROM module_settings WHERE version_id = $1 ORDER BY priority
            """, version_id)
            
            # Get TCA categories
            tca_rows = await conn.fetch("""
                SELECT id, category_name, category_order, weight, 
                       COALESCE(medtech_weight, weight) as medtech_weight,
                       is_active, COALESCE(is_medtech_active, is_active) as is_medtech_active,
                       COALESCE(normalization_key, '') as normalization_key,
                       description, factors
                FROM tca_category_settings WHERE version_id = $1 ORDER BY category_order
            """, version_id)
            
            return SettingsVersion(
                id=version_row['id'],
                version_number=version_row['version_number'],
                version_name=version_row['version_name'],
                description=version_row['description'],
                created_by=version_row['created_by'],
                created_at=version_row['created_at'],
                is_active=version_row['is_active'],
                is_archived=version_row['is_archived'],
                module_settings=[ModuleSetting(
                    id=r['id'],
                    module_id=r['module_id'],
                    module_name=r['module_name'],
                    weight=float(r['weight']),
                    is_enabled=r['is_enabled'],
                    priority=r['priority'],
                    settings=parse_json_field(r['settings']),
                    thresholds=parse_json_field(r['thresholds'])
                ) for r in module_rows],
                tca_categories=[TCACategory(
                    id=r['id'],
                    category_name=r['category_name'],
                    category_order=r['category_order'],
                    weight=float(r['weight']),
                    medtech_weight=float(r['medtech_weight']),
                    is_active=r['is_active'],
                    is_medtech_active=r['is_medtech_active'],
                    normalization_key=r['normalization_key'] or None,
                    description=r['description'],
                    factors=r['factors'] or []
                ) for r in tca_rows]
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/versions/{version_id}", response_model=SettingsVersion)
async def get_settings_version(version_id: int):
    """Get a specific settings version with all module settings and TCA categories"""
    try:
        async with db_manager.get_connection() as conn:
            # Get version
            version_row = await conn.fetchrow("""
                SELECT id, version_number, version_name, description, 
                       created_by, created_at, is_active, is_archived
                FROM module_settings_versions WHERE id = $1
            """, version_id)
            
            if not version_row:
                raise HTTPException(status_code=404, detail="Settings version not found")
            
            # Get module settings
            module_rows = await conn.fetch("""
                SELECT id, module_id, module_name, weight, is_enabled, priority, settings, thresholds
                FROM module_settings WHERE version_id = $1 ORDER BY priority
            """, version_id)
            
            # Get TCA categories with dual framework weights
            tca_rows = await conn.fetch("""
                SELECT id, category_name, category_order, weight, 
                       COALESCE(medtech_weight, weight) as medtech_weight,
                       is_active, COALESCE(is_medtech_active, is_active) as is_medtech_active,
                       COALESCE(normalization_key, '') as normalization_key,
                       description, factors
                FROM tca_category_settings WHERE version_id = $1 ORDER BY category_order
            """, version_id)
            
            return SettingsVersion(
                id=version_row['id'],
                version_number=version_row['version_number'],
                version_name=version_row['version_name'],
                description=version_row['description'],
                created_by=version_row['created_by'],
                created_at=version_row['created_at'],
                is_active=version_row['is_active'],
                is_archived=version_row['is_archived'],
                module_settings=[ModuleSetting(
                    id=r['id'],
                    module_id=r['module_id'],
                    module_name=r['module_name'],
                    weight=float(r['weight']),
                    is_enabled=r['is_enabled'],
                    priority=r['priority'],
                    settings=parse_json_field(r['settings']),
                    thresholds=parse_json_field(r['thresholds'])
                ) for r in module_rows],
                tca_categories=[TCACategory(
                    id=r['id'],
                    category_name=r['category_name'],
                    category_order=r['category_order'],
                    weight=float(r['weight']),
                    medtech_weight=float(r['medtech_weight']),
                    is_active=r['is_active'],
                    is_medtech_active=r['is_medtech_active'],
                    normalization_key=r['normalization_key'] or None,
                    description=r['description'],
                    factors=r['factors'] or []
                ) for r in tca_rows]
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/versions", response_model=SettingsVersion)
async def create_settings_version(data: SettingsVersionCreate):
    """Create a new settings version"""
    try:
        async with db_manager.get_transaction() as conn:
            # Get next version number
            max_version = await conn.fetchval(
                "SELECT COALESCE(MAX(version_number), 0) FROM module_settings_versions"
            )
            new_version_number = max_version + 1
            
            # Create version
            version_id = await conn.fetchval("""
                INSERT INTO module_settings_versions 
                (version_number, version_name, description, is_active)
                VALUES ($1, $2, $3, FALSE)
                RETURNING id
            """, new_version_number, data.version_name, data.description)
            
            # Copy from existing version or use defaults
            if data.copy_from_version:
                # Copy module settings
                await conn.execute("""
                    INSERT INTO module_settings (version_id, module_id, module_name, weight, is_enabled, priority, settings, thresholds)
                    SELECT $1, module_id, module_name, weight, is_enabled, priority, settings, thresholds
                    FROM module_settings WHERE version_id = $2
                """, version_id, data.copy_from_version)
                
                # Copy TCA categories with dual framework weights
                await conn.execute("""
                    INSERT INTO tca_category_settings (version_id, category_name, category_order, weight, medtech_weight, is_active, is_medtech_active, normalization_key, description, factors)
                    SELECT $1, category_name, category_order, weight, COALESCE(medtech_weight, weight), is_active, COALESCE(is_medtech_active, is_active), normalization_key, description, factors
                    FROM tca_category_settings WHERE version_id = $2
                """, version_id, data.copy_from_version)
            else:
                # Use default settings
                for ms in DEFAULT_MODULE_SETTINGS:
                    await conn.execute("""
                        INSERT INTO module_settings (version_id, module_id, module_name, weight, is_enabled, priority)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    """, version_id, ms.module_id.value, ms.module_name, ms.weight, ms.is_enabled, ms.priority)
                
                for tc in DEFAULT_TCA_CATEGORIES:
                    await conn.execute("""
                        INSERT INTO tca_category_settings (version_id, category_name, category_order, weight, medtech_weight, is_active, is_medtech_active, normalization_key, description, factors)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    """, version_id, tc.category_name, tc.category_order, tc.weight, tc.medtech_weight, tc.is_active, tc.is_medtech_active, tc.normalization_key, tc.description, tc.factors)
            
            return await get_settings_version(version_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/versions/{version_id}", response_model=SettingsVersion)
async def update_settings_version(version_id: int, data: SettingsVersionUpdate):
    """Update a settings version"""
    try:
        async with db_manager.get_transaction() as conn:
            # If setting as active, deactivate others
            if data.is_active:
                await conn.execute("UPDATE module_settings_versions SET is_active = FALSE")
            
            updates = []
            params = [version_id]
            param_idx = 2
            
            if data.version_name is not None:
                updates.append(f"version_name = ${param_idx}")
                params.append(data.version_name)
                param_idx += 1
            if data.description is not None:
                updates.append(f"description = ${param_idx}")
                params.append(data.description)
                param_idx += 1
            if data.is_active is not None:
                updates.append(f"is_active = ${param_idx}")
                params.append(data.is_active)
                param_idx += 1
            if data.is_archived is not None:
                updates.append(f"is_archived = ${param_idx}")
                params.append(data.is_archived)
                param_idx += 1
            
            if updates:
                query = f"UPDATE module_settings_versions SET {', '.join(updates)} WHERE id = $1"
                await conn.execute(query, *params)
            
            return await get_settings_version(version_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== Module Settings =====

@router.put("/versions/{version_id}/modules/{module_id}", response_model=ModuleSetting)
async def update_module_setting(version_id: int, module_id: str, data: ModuleSettingUpdate):
    """Update a specific module setting within a version"""
    try:
        async with db_manager.get_transaction() as conn:
            updates = []
            params = [version_id, module_id]
            param_idx = 3
            
            if data.weight is not None:
                updates.append(f"weight = ${param_idx}")
                params.append(data.weight)
                param_idx += 1
            if data.is_enabled is not None:
                updates.append(f"is_enabled = ${param_idx}")
                params.append(data.is_enabled)
                param_idx += 1
            if data.priority is not None:
                updates.append(f"priority = ${param_idx}")
                params.append(data.priority)
                param_idx += 1
            if data.settings is not None:
                updates.append(f"settings = ${param_idx}")
                params.append(data.settings)
                param_idx += 1
            if data.thresholds is not None:
                updates.append(f"thresholds = ${param_idx}")
                params.append(data.thresholds)
                param_idx += 1
            
            updates.append("updated_at = NOW()")
            
            query = f"""
                UPDATE module_settings 
                SET {', '.join(updates)} 
                WHERE version_id = $1 AND module_id = $2
                RETURNING id, module_id, module_name, weight, is_enabled, priority, settings, thresholds
            """
            row = await conn.fetchrow(query, *params)
            
            if not row:
                raise HTTPException(status_code=404, detail="Module setting not found")
            
            return ModuleSetting(
                id=row['id'],
                module_id=row['module_id'],
                module_name=row['module_name'],
                weight=float(row['weight']),
                is_enabled=row['is_enabled'],
                priority=row['priority'],
                settings=row['settings'] or {},
                thresholds=row['thresholds'] or {}
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== TCA Categories =====

@router.get("/versions/{version_id}/tca-categories", response_model=List[TCACategory])
async def get_tca_categories(version_id: int):
    """Get all TCA categories for a version with dual framework weights"""
    try:
        async with db_manager.get_connection() as conn:
            rows = await conn.fetch("""
                SELECT id, category_name, category_order, weight, 
                       COALESCE(medtech_weight, weight) as medtech_weight,
                       is_active, COALESCE(is_medtech_active, is_active) as is_medtech_active,
                       COALESCE(normalization_key, '') as normalization_key,
                       description, factors
                FROM tca_category_settings WHERE version_id = $1 ORDER BY category_order
            """, version_id)
            
            return [TCACategory(
                id=r['id'],
                category_name=r['category_name'],
                category_order=r['category_order'],
                weight=float(r['weight']),
                medtech_weight=float(r['medtech_weight']),
                is_active=r['is_active'],
                is_medtech_active=r['is_medtech_active'],
                normalization_key=r['normalization_key'] or None,
                description=r['description'],
                factors=r['factors'] or []
            ) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/versions/{version_id}/tca-categories/{category_id}", response_model=TCACategory)
async def update_tca_category(version_id: int, category_id: int, data: TCACategoryUpdate):
    """Update a specific TCA category setting with dual framework weights"""
    try:
        async with db_manager.get_transaction() as conn:
            updates = []
            params = [category_id, version_id]
            param_idx = 3
            
            if data.weight is not None:
                updates.append(f"weight = ${param_idx}")
                params.append(data.weight)
                param_idx += 1
            if data.medtech_weight is not None:
                updates.append(f"medtech_weight = ${param_idx}")
                params.append(data.medtech_weight)
                param_idx += 1
            if data.is_active is not None:
                updates.append(f"is_active = ${param_idx}")
                params.append(data.is_active)
                param_idx += 1
            if data.is_medtech_active is not None:
                updates.append(f"is_medtech_active = ${param_idx}")
                params.append(data.is_medtech_active)
                param_idx += 1
            if data.description is not None:
                updates.append(f"description = ${param_idx}")
                params.append(data.description)
                param_idx += 1
            if data.factors is not None:
                updates.append(f"factors = ${param_idx}")
                params.append(data.factors)
                param_idx += 1
            
            updates.append("updated_at = NOW()")
            
            query = f"""
                UPDATE tca_category_settings 
                SET {', '.join(updates)} 
                WHERE id = $1 AND version_id = $2
                RETURNING id, category_name, category_order, weight, 
                          COALESCE(medtech_weight, weight) as medtech_weight,
                          is_active, COALESCE(is_medtech_active, is_active) as is_medtech_active,
                          COALESCE(normalization_key, '') as normalization_key,
                          description, factors
            """
            row = await conn.fetchrow(query, *params)
            
            if not row:
                raise HTTPException(status_code=404, detail="TCA category not found")
            
            return TCACategory(
                id=row['id'],
                category_name=row['category_name'],
                category_order=row['category_order'],
                weight=float(row['weight']),
                medtech_weight=float(row['medtech_weight']),
                is_active=row['is_active'],
                is_medtech_active=row['is_medtech_active'],
                normalization_key=row['normalization_key'] or None,
                description=row['description'],
                factors=row['factors'] or []
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== Simulation Runs =====

@router.get("/simulations", response_model=List[SimulationRun])
async def get_simulation_runs(
    user_id: Optional[int] = None,
    settings_version_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=200)
):
    """Get simulation runs with optional filters"""
    try:
        async with db_manager.get_connection() as conn:
            conditions = []
            params = []
            param_idx = 1
            
            if user_id:
                conditions.append(f"user_id = ${param_idx}")
                params.append(user_id)
                param_idx += 1
            if settings_version_id:
                conditions.append(f"settings_version_id = ${param_idx}")
                params.append(settings_version_id)
                param_idx += 1
            
            where_clause = " AND ".join(conditions) if conditions else "TRUE"
            params.append(limit)
            
            query = f"""
                SELECT id, settings_version_id, user_id, company_name, analysis_id,
                       tca_score, module_scores, simulation_data, run_at, completed_at, status
                FROM simulation_runs
                WHERE {where_clause}
                ORDER BY run_at DESC
                LIMIT ${param_idx}
            """
            
            rows = await conn.fetch(query, *params)
            
            return [SimulationRun(
                id=r['id'],
                settings_version_id=r['settings_version_id'],
                user_id=r['user_id'],
                company_name=r['company_name'],
                analysis_id=r['analysis_id'],
                tca_score=float(r['tca_score']) if r['tca_score'] else None,
                module_scores=r['module_scores'] or {},
                simulation_data=r['simulation_data'] or {},
                run_at=r['run_at'],
                completed_at=r['completed_at'],
                status=r['status']
            ) for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simulations", response_model=SimulationResult)
async def run_simulation(data: SimulationRunCreate):
    """Run a simulation with specific settings version"""
    try:
        async with db_manager.get_transaction() as conn:
            # Get settings version
            settings = await get_settings_version(data.settings_version_id)
            
            # Calculate module scores separately
            module_scores: Dict[str, float] = {}
            
            # Calculate TCA score from 12 categories
            tca_categories = settings.tca_categories
            if tca_categories and data.adjusted_scores and 'tca' in data.adjusted_scores:
                tca_data = data.adjusted_scores['tca']
                total_weight = sum(c.weight for c in tca_categories if c.is_active)
                if total_weight > 0:
                    weighted_sum = 0
                    for cat in tca_categories:
                        if cat.is_active:
                            # Find score for this category
                            cat_score = next((s.get('score', 5.0) for s in tca_data if s.get('category') == cat.category_name), 5.0)
                            weighted_sum += cat_score * cat.weight
                    module_scores['tca'] = weighted_sum / total_weight
                else:
                    module_scores['tca'] = 5.0
            else:
                module_scores['tca'] = 5.0  # Default
            
            # Calculate other module scores separately
            for ms in settings.module_settings:
                if ms.is_enabled and ms.module_id.value != 'tca':
                    if data.adjusted_scores and ms.module_id.value in data.adjusted_scores:
                        scores = data.adjusted_scores[ms.module_id.value]
                        if isinstance(scores, list) and len(scores) > 0:
                            module_scores[ms.module_id.value] = sum(s.get('score', 5.0) for s in scores) / len(scores)
                        else:
                            module_scores[ms.module_id.value] = 5.0
                    else:
                        module_scores[ms.module_id.value] = 5.0  # Default
            
            # TCA score is the primary outcome
            tca_score = module_scores.get('tca', 5.0)
            
            # Insert simulation run
            run_id = await conn.fetchval("""
                INSERT INTO simulation_runs 
                (settings_version_id, company_name, analysis_id, tca_score, module_scores, simulation_data, status, completed_at)
                VALUES ($1, $2, $3, $4, $5, $6, 'completed', NOW())
                RETURNING id
            """, data.settings_version_id, data.company_name, data.analysis_id, 
                tca_score, module_scores, data.adjusted_scores or {})
            
            return SimulationResult(
                simulation_id=run_id,
                tca_score=tca_score,
                module_scores=module_scores,
                settings_version=settings,
                timestamp=datetime.utcnow(),
                status="completed"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/simulations/{simulation_id}", response_model=SimulationRun)
async def get_simulation_run(simulation_id: int):
    """Get a specific simulation run"""
    try:
        async with db_manager.get_connection() as conn:
            row = await conn.fetchrow("""
                SELECT id, settings_version_id, user_id, company_name, analysis_id,
                       tca_score, module_scores, simulation_data, run_at, completed_at, status
                FROM simulation_runs WHERE id = $1
            """, simulation_id)
            
            if not row:
                raise HTTPException(status_code=404, detail="Simulation run not found")
            
            return SimulationRun(
                id=row['id'],
                settings_version_id=row['settings_version_id'],
                user_id=row['user_id'],
                company_name=row['company_name'],
                analysis_id=row['analysis_id'],
                tca_score=float(row['tca_score']) if row['tca_score'] else None,
                module_scores=row['module_scores'] or {},
                simulation_data=row['simulation_data'] or {},
                run_at=row['run_at'],
                completed_at=row['completed_at'],
                status=row['status']
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/simulations/compare/{version_id_1}/{version_id_2}")
async def compare_simulation_versions(version_id_1: int, version_id_2: int):
    """Compare two settings versions"""
    try:
        v1 = await get_settings_version(version_id_1)
        v2 = await get_settings_version(version_id_2)
        
        module_diff = []
        for ms1 in v1.module_settings:
            ms2 = next((m for m in v2.module_settings if m.module_id == ms1.module_id), None)
            if ms2:
                if ms1.weight != ms2.weight or ms1.is_enabled != ms2.is_enabled:
                    module_diff.append({
                        "module_id": ms1.module_id.value,
                        "version_1": {"weight": ms1.weight, "is_enabled": ms1.is_enabled},
                        "version_2": {"weight": ms2.weight, "is_enabled": ms2.is_enabled}
                    })
        
        tca_diff = []
        for tc1 in v1.tca_categories:
            tc2 = next((t for t in v2.tca_categories if t.category_name == tc1.category_name), None)
            if tc2:
                if tc1.weight != tc2.weight or tc1.is_active != tc2.is_active:
                    tca_diff.append({
                        "category_name": tc1.category_name,
                        "version_1": {"weight": tc1.weight, "is_active": tc1.is_active},
                        "version_2": {"weight": tc2.weight, "is_active": tc2.is_active}
                    })
        
        return {
            "version_1": {"id": v1.id, "name": v1.version_name},
            "version_2": {"id": v2.id, "name": v2.version_name},
            "module_differences": module_diff,
            "tca_category_differences": tca_diff,
            "total_differences": len(module_diff) + len(tca_diff)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
