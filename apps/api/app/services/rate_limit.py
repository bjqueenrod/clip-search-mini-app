from __future__ import annotations

import time
from collections import defaultdict
from collections.abc import MutableSequence

from fastapi import HTTPException


_BUCKETS: dict[str, MutableSequence[float]] = defaultdict(list)
WINDOW_SECONDS = 30
MAX_REQUESTS = 60



def enforce_rate_limit(key: str) -> None:
    now = time.time()
    bucket = _BUCKETS[key]
    while bucket and bucket[0] < now - WINDOW_SECONDS:
        bucket.pop(0)
    if len(bucket) >= MAX_REQUESTS:
        raise HTTPException(status_code=429, detail="Too many requests. Please slow down.")
    bucket.append(now)
