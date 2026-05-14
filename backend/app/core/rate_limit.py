"""
Lightweight per-key sliding-window rate limiter.

Intended for endpoints that are sensitive to abuse (login, forgot-password,
webhooks) where the global request-per-IP middleware is too permissive.

This is an in-process implementation suitable for a single backend instance.
For horizontally-scaled deployments, swap in a Redis-backed counter.
"""

from __future__ import annotations

import asyncio
import time
from collections import deque
from typing import Deque, Dict, Tuple


class SlidingWindowRateLimiter:
    """Token-less sliding window limiter keyed by an arbitrary string."""

    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._buckets: Dict[str, Deque[float]] = {}
        self._lock = asyncio.Lock()

    async def check(self, key: str) -> Tuple[bool, int]:
        """Return (allowed, retry_after_seconds).

        retry_after_seconds is 0 when allowed.
        """
        now = time.monotonic()
        cutoff = now - self.window_seconds
        async with self._lock:
            bucket = self._buckets.get(key)
            if bucket is None:
                bucket = deque()
                self._buckets[key] = bucket
            while bucket and bucket[0] < cutoff:
                bucket.popleft()
            if len(bucket) >= self.max_requests:
                retry_after = max(1, int(bucket[0] + self.window_seconds - now))
                return False, retry_after
            bucket.append(now)
            return True, 0


# Pre-configured limiters used across the backend.
forgot_password_limiter = SlidingWindowRateLimiter(
    max_requests=5, window_seconds=60 * 15
)
ssd_webhook_limiter = SlidingWindowRateLimiter(
    max_requests=60, window_seconds=60
)
