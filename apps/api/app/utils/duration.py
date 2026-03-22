from __future__ import annotations

import re


DURATION_RE = re.compile(r"^(?:(\d+):)?(\d{1,2}):(\d{2})$")



def parse_duration_seconds(value: object) -> int | None:
    if value is None:
        return None
    raw = str(value).strip()
    if not raw:
        return None
    if raw.isdigit():
        digits = int(raw)
        if digits <= 0:
            return None
        return digits
    match = DURATION_RE.match(raw)
    if match:
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        return hours * 3600 + minutes * 60 + seconds
    minute_match = re.match(r"^(\d+)\s*(m|min|mins|minutes)$", raw, re.IGNORECASE)
    if minute_match:
        return int(minute_match.group(1)) * 60
    return None



def format_duration_label(value: object) -> str | None:
    if value is None:
        return None
    raw = str(value).strip()
    if not raw:
        return None
    seconds = parse_duration_seconds(raw)
    if seconds is None:
        return raw
    hours, remainder = divmod(seconds, 3600)
    minutes, secs = divmod(remainder, 60)
    if hours:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes}:{secs:02d}"
