from __future__ import annotations

from app.services import preview_service


class _FakePreviewClient:
    def __init__(self, *, embed_accessible: bool) -> None:
        self.embed_accessible = embed_accessible

    def build_preview_webp_url(self, preview_id: str) -> str:
        return f"https://cdn.example/{preview_id}/preview.webp"

    def get_video(self, preview_id: str) -> dict[str, str]:
        return {"thumbnailFileName": "thumb.jpg"}

    def build_thumbnail_url(self, preview_id: str, thumbnail_file_name: str | None) -> str | None:
        if not thumbnail_file_name:
            return None
        return f"https://cdn.example/{preview_id}/{thumbnail_file_name}"

    def build_embed_url(self, preview_id: str) -> str:
        return f"https://iframe.mediadelivery.net/embed/lib/{preview_id}?token=test&expires=999"

    def is_embed_url_accessible(self, embed_url: str) -> bool:
        return self.embed_accessible


def test_build_preview_assets_keeps_embed_url_when_accessible(monkeypatch) -> None:
    monkeypatch.setattr(
        preview_service,
        "get_preview_client",
        lambda: _FakePreviewClient(embed_accessible=True),
    )

    assets = preview_service.build_preview_assets("preview-1")

    assert assets["previewEmbedUrl"] == "https://iframe.mediadelivery.net/embed/lib/preview-1?token=test&expires=999"
    assert assets["previewType"] == "video"


def test_build_preview_assets_falls_back_to_image_when_embed_is_forbidden(monkeypatch) -> None:
    monkeypatch.setattr(
        preview_service,
        "get_preview_client",
        lambda: _FakePreviewClient(embed_accessible=False),
    )

    assets = preview_service.build_preview_assets("preview-1")

    assert assets["previewEmbedUrl"] is None
    assert assets["thumbnailUrl"] == "https://cdn.example/preview-1/thumb.jpg"
    assert assets["previewWebpUrl"] == "https://cdn.example/preview-1/preview.webp"
    assert assets["previewType"] == "image"
