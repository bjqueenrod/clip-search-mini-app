from __future__ import annotations

from app.api import deps
from app.main import app


def test_checkout_uses_tribute_code_when_selected_method_requires_code(client, monkeypatch) -> None:
    from app.services import payment_gateway

    captured: dict[str, str | None] = {}

    monkeypatch.setattr(payment_gateway, "create_order", lambda **kwargs: {"id": 123})
    monkeypatch.setattr(
        payment_gateway,
        "invoice_options",
        lambda **kwargs: {
            "payment_methods": [
                {
                    "id": -1,
                    "payment_method": "paypal",
                    "requires_code": True,
                    "tribute_code": "MBJQ-KEY-TEST",
                    "instruction_templates": {"checkout_default": "Use {code}"},
                    "method_details": {},
                }
            ]
        },
    )

    def fake_create_invoice(**kwargs):
        captured["code"] = kwargs.get("code")
        return {
            "invoice": {"invoice_id": "inv_123"},
            "invoice_url": "https://example.com/invoice",
            "provider_invoice_url": "https://example.com/provider",
        }

    monkeypatch.setattr(payment_gateway, "create_invoice", fake_create_invoice)
    app.dependency_overrides[deps.get_session] = lambda: {
        "telegram_user_id": 123456,
        "start_param": "flow-1",
        "flow_id": "flow-1",
    }
    try:
        response = client.post(
            "/api/payments/checkout",
            json={
                "productId": "BJQ0001",
                "paymentMethod": "paypal",
                "quantity": 1,
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["paymentCode"] == "MBJQ-KEY-TEST"
    assert captured["code"] == "MBJQ-KEY-TEST"
