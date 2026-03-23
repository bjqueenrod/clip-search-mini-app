from __future__ import annotations

import hashlib
import time
from typing import Any

import httpx

from app.core.config import get_settings


class BunnyConfigError(RuntimeError):
    pass


class BunnyPreviewClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._cache: dict[str, tuple[float, dict[str, Any]]] = {}
        self._embed_access_cache: dict[str, tuple[float, bool]] = {}

    def _require_library(self) -> None:
        if not self.settings.bunny_stream_library_id:
            raise BunnyConfigError("BUNNY_STREAM_LIBRARY_ID is not configured")

    def _require_metadata_config(self) -> None:
        self._require_library()
        if not self.settings.bunny_stream_api_key:
            raise BunnyConfigError("BUNNY_STREAM_API_KEY is not configured")

    def _require_embed_config(self) -> None:
        self._require_library()
        if not self.settings.bunny_stream_embed_token_key:
            raise BunnyConfigError("BUNNY_STREAM_EMBED_TOKEN_KEY is not configured")

    def get_video(self, video_id: str) -> dict[str, Any]:
        self._require_metadata_config()
        cache_key = video_id.strip()
        cached = self._cache.get(cache_key)
        now = time.time()
        if cached and cached[0] > now:
            return cached[1]

        url = (
            f"https://video.bunnycdn.com/library/"
            f"{self.settings.bunny_stream_library_id}/videos/{cache_key}"
        )
        headers = {"AccessKey": self.settings.bunny_stream_api_key, "accept": "application/json"}
        with httpx.Client(timeout=15.0) as client:
            response = client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
        self._cache[cache_key] = (now + 600, data)
        return data

    def build_embed_url(self, video_id: str, *, expires_in_seconds: int = 60 * 60 * 24) -> str:
        self._require_embed_config()
        expires = int(time.time()) + int(expires_in_seconds)
        raw = f"{self.settings.bunny_stream_embed_token_key}{video_id}{expires}".encode("utf-8")
        token = hashlib.sha256(raw).hexdigest()
        return (
            f"https://iframe.mediadelivery.net/embed/"
            f"{self.settings.bunny_stream_library_id}/{video_id}?token={token}&expires={expires}"
        )

    def is_embed_url_accessible(self, embed_url: str) -> bool:
        cache_key = embed_url.strip()
        if not cache_key:
            return False
        cached = self._embed_access_cache.get(cache_key)
        now = time.time()
        if cached and cached[0] > now:
            return cached[1]

        headers = {"accept": "text/html,application/xhtml+xml"}
        frontend_url = self.settings.frontend_url.strip().rstrip("/")
        if frontend_url:
            headers["Origin"] = frontend_url
            headers["Referer"] = f"{frontend_url}/"

        ok = False
        try:
            with httpx.Client(timeout=10.0, follow_redirects=True) as client:
                response = client.get(cache_key, headers=headers)
                ok = response.status_code < 400
        except Exception:
            ok = False

        self._embed_access_cache[cache_key] = (now + 600, ok)
        return ok

    def build_thumbnail_url(self, video_id: str, thumbnail_file_name: str | None) -> str | None:
        host = self.settings.normalized_bunny_cdn_host
        if not host or not thumbnail_file_name:
            return None
        return f"{host}/{video_id}/{thumbnail_file_name}"

    def build_preview_webp_url(self, video_id: str) -> str | None:
        host = self.settings.normalized_bunny_cdn_host
        if not host:
            return None
        return f"{host}/{video_id}/preview.webp"
