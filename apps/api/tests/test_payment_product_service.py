from __future__ import annotations


def test_get_clip_pricing_uses_cache(monkeypatch) -> None:
    from app.services import payment_product_service as service

    calls: list[str] = []

    def fake_fetch(clip_id: str):
        calls.append(clip_id)
        return {
            "clip_id": clip_id,
            "pricing": {
                "gbp": {"amount_pence": 1299, "formatted": "£12.99"},
                "usd": {"amount_pence": 1599, "formatted": "$15.99"},
            },
        }

    monkeypatch.setattr(service, "_fetch_clip_pricing", fake_fetch)

    first = service.get_clip_pricing("bjq0001")
    second = service.get_clip_pricing("BJQ0001")

    assert first == second
    assert calls == ["BJQ0001"]


def test_get_clip_pricings_dedupes_clip_ids(monkeypatch) -> None:
    from app.services import payment_product_service as service

    calls: list[str] = []

    def fake_fetch(clip_id: str):
        calls.append(clip_id)
        return {
            "clip_id": clip_id,
            "pricing": {
                "gbp": {"amount_pence": 1299, "formatted": "£12.99"},
                "usd": {"amount_pence": 1599, "formatted": "$15.99"},
            },
        }

    monkeypatch.setattr(service, "_fetch_clip_pricing", fake_fetch)
    monkeypatch.setattr(service, "_request_url", lambda path: None if path == "/api/clips/pricing" else None)

    pricing_by_id = service.get_clip_pricings(["bjq0001", "BJQ0002", "BJQ0001"])

    assert set(calls) == {"BJQ0001", "BJQ0002"}
    assert set(pricing_by_id) == {"BJQ0001", "BJQ0002"}
