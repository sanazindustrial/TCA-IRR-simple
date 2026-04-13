"""
JSON utilities for handling datetime serialization
"""
import json
from datetime import datetime
from typing import Any


class DateTimeEncoder(json.JSONEncoder):
    """JSON encoder that handles datetime objects"""

    def default(self, obj: Any) -> Any:
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


def json_response_with_datetime(data: Any) -> str:
    """Convert data to JSON string with datetime support"""
    return json.dumps(data, cls=DateTimeEncoder)