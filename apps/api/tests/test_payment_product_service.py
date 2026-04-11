from __future__ import annotations

import httpx


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


def test_get_clip_pricing_retries_transient_timeout(monkeypatch) -> None:
    from app.services import payment_product_service as service

    calls: list[tuple[str, float | None]] = []

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict[str, object]:
            return {
                "item": {
                    "clip_id": "BJQ0003",
                    "pricing": {
                        "gbp": {"amount_pence": 1099, "formatted": "£10.99"},
                        "usd": {"amount_pence": 1399, "formatted": "$13.99"},
                    },
                }
            }

    def fake_get(url, headers=None, params=None, timeout=None):
        calls.append((url, timeout))
        if len(calls) == 1:
            request = httpx.Request("GET", url)
            raise httpx.ReadTimeout("timed out", request=request)
        return FakeResponse()

    monkeypatch.setattr(service.settings, "payment_system_api_url", "https://payments.example")
    monkeypatch.setattr(service.settings, "payment_system_timeout_seconds", 4.0)
    monkeypatch.setattr(service.httpx, "get", fake_get)

    pricing = service.get_clip_pricing("bjq0003")

    assert pricing and pricing["clip_id"] == "BJQ0003"
    assert len(calls) == 2
    assert all(timeout and timeout >= 8.0 for _, timeout in calls)
