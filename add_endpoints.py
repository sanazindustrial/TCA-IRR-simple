#!/usr/bin/env python3
"""Script to add missing API endpoints to main.py"""

content = open('main.py', 'r', encoding='utf-8').read()

# Find position after delete_upload error handler and before the unicode comment
marker = '        raise HTTPException(status_code=500, detail=str(e))\n\n\n#'
idx = content.find(marker, 40000)  # Start searching after position 40000

if idx > 30000:
    print(f'Found marker at position {idx}')
    
    new_endpoints = '''        raise HTTPException(status_code=500, detail=str(e))


# ─── Analysis List and Module Weights Endpoints ─────────────────────────────

@app.get("/api/analysis/list")
async def list_analyses(limit: int = 50, status: Optional[str] = None):
    """List all analyses with optional status filter"""
    try:
        async with db_manager.get_connection() as conn:
            # Try to query from evaluations table for analysis records
            if status:
                rows = await conn.fetch(
                    """SELECT evaluation_id, company_name, status, 
                              created_at, total_score
                       FROM evaluations
                       WHERE status = $1
                       ORDER BY created_at DESC LIMIT $2""",
                    status, limit
                )
            else:
                rows = await conn.fetch(
                    """SELECT evaluation_id, company_name, status, 
                              created_at, total_score
                       FROM evaluations
                       ORDER BY created_at DESC LIMIT $1""",
                    limit
                )
            return {
                "total": len(rows),
                "analyses": [
                    {
                        "analysis_id": str(row["evaluation_id"]),
                        "company_name": row.get("company_name", "Unknown"),
                        "status": row.get("status", "unknown"),
                        "created_at": row.get("created_at").isoformat() if row.get("created_at") else None,
                        "total_score": row.get("total_score")
                    }
                    for row in rows
                ]
            }
    except Exception as e:
        logger.error(f"List analyses error: {e}")
        # Return empty list if table doesn't exist yet
        return {"total": 0, "analyses": [], "note": "No analyses found or table not initialized"}


@app.get("/api/modules/weights")
async def get_module_weights():
    """Get the 9-module analysis weights configuration"""
    weights = {}
    for module in NINE_MODULES:
        weights[module["id"]] = {
            "name": module["name"],
            "weight": module["weight"],
            "max_contribution": round(module["weight"] / 17.5 * 10, 2)  # Normalized to 10-point scale
        }
    
    # Check if custom SSD weights are configured
    custom_weights = SSD_MODULE_WEIGHTS if SSD_MODULE_WEIGHTS else None
    
    return {
        "modules": weights,
        "total_weight": 17.5,
        "scale": "0-10",
        "custom_ssd_weights": custom_weights,
        "module_count": len(NINE_MODULES)
    }


#'''
    
    # Replace the marker
    new_content = content[:idx] + new_endpoints + content[idx + len(marker):]
    
    open('main.py', 'w', encoding='utf-8').write(new_content)
    print('Successfully added new endpoints!')
else:
    print(f'Marker not found or at unexpected position: {idx}')
