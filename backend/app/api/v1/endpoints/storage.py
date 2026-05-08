"""
Key-Value Storage API endpoints
Used by the frontend azure-storage-service.ts as a backend-persisted alternative to localStorage.
"""

import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Any, Optional
import json

from app.db import get_db
from .auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

# Ensure the key_value_store table exists (lazy create on first use)
_TABLE_ENSURED = False

async def _ensure_table(db):
    global _TABLE_ENSURED
    if _TABLE_ENSURED:
        return
    try:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS key_value_store (
                id SERIAL PRIMARY KEY,
                key VARCHAR(512) NOT NULL,
                value TEXT,
                user_id INTEGER,
                user_email VARCHAR(255),
                metadata TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(key, user_id)
            )
        """)
        await db.execute("""
            CREATE INDEX IF NOT EXISTS idx_kv_key_user ON key_value_store(key, user_id)
        """)
        _TABLE_ENSURED = True
    except Exception as e:
        logger.warning(f"Could not ensure key_value_store table: {e}")


@router.post("")
async def set_value(
    payload: dict,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Store a key-value pair for the current user"""
    key = payload.get("key")
    if not key:
        raise HTTPException(status_code=400, detail="key is required")

    value = payload.get("value")
    user_id = current_user.get("id") or payload.get("user_id")
    user_email = current_user.get("email") or payload.get("user_email", "")
    metadata = payload.get("metadata")

    # Serialize value and metadata to JSON strings if they aren't already
    value_str = json.dumps(value) if not isinstance(value, str) else value
    metadata_str = json.dumps(metadata) if metadata is not None and not isinstance(metadata, str) else metadata

    await _ensure_table(db)

    try:
        await db.execute(
            """
            INSERT INTO key_value_store (key, value, user_id, user_email, metadata, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (key, user_id)
            DO UPDATE SET value = EXCLUDED.value,
                          user_email = EXCLUDED.user_email,
                          metadata = EXCLUDED.metadata,
                          updated_at = NOW()
            """,
            key, value_str, user_id, user_email, metadata_str,
        )
    except Exception as e:
        # If table still doesn't exist or schema mismatch, fall back gracefully
        logger.error(f"Storage set error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save: {str(e)}")

    return {"success": True, "key": key, "saved_at": datetime.utcnow().isoformat()}


@router.get("/{key}")
async def get_value(
    key: str,
    user_id: Optional[int] = Query(None),
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Retrieve a stored value by key"""
    resolved_user_id = current_user.get("id") or user_id

    await _ensure_table(db)

    try:
        row = await db.fetchrow(
            "SELECT key, value, user_email, metadata, updated_at FROM key_value_store WHERE key = $1 AND user_id = $2",
            key, resolved_user_id,
        )
    except Exception as e:
        logger.error(f"Storage get error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve: {str(e)}")

    if not row:
        raise HTTPException(status_code=404, detail="Key not found")

    # Try to deserialize value from JSON
    raw_value = row["value"]
    try:
        parsed_value = json.loads(raw_value) if raw_value else None
    except (json.JSONDecodeError, TypeError):
        parsed_value = raw_value

    return {
        "key": row["key"],
        "value": parsed_value,
        "user_email": row["user_email"],
        "updated_at": row["updated_at"].isoformat() if row["updated_at"] else None,
    }


@router.delete("/{key}")
async def delete_value(
    key: str,
    db=Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete a stored value by key"""
    user_id = current_user.get("id")

    await _ensure_table(db)

    try:
        result = await db.execute(
            "DELETE FROM key_value_store WHERE key = $1 AND user_id = $2",
            key, user_id,
        )
    except Exception as e:
        logger.error(f"Storage delete error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete: {str(e)}")

    return {"success": True, "key": key}
