from __future__ import annotations

from functools import lru_cache

from itsdangerous import URLSafeTimedSerializer

from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_session_serializer() -> URLSafeTimedSerializer:
    settings = get_settings()
    return URLSafeTimedSerializer(settings.session_secret, salt="clip-mini-app-session")
