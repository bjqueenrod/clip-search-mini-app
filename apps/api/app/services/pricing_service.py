from __future__ import annotations

from typing import Any


def coerce_pence(value: Any) -> int | None:
    if value in (None, ""):
        return None
    try:
        amount = int(round(float(value)))
    except (TypeError, ValueError):
        return None
    if amount < 0:
        return None
    return amount


def _coerce_rate(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        rate = float(value)
    except (TypeError, ValueError):
        return None
    if rate <= 0:
        return None
    return rate


def fx_snapshot_from_pricing(pricing: dict[str, Any] | None) -> dict[str, Any] | None:
    if not isinstance(pricing, dict):
        return None
    fx = pricing.get("fx")
    if not isinstance(fx, dict):
        return None
    rate = _coerce_rate(fx.get("rate"))
    fetched_at = fx.get("fetched_at") if isinstance(fx.get("fetched_at"), str) else None
    if rate is None:
        return None
    return {"rate": rate, "fetched_at": fetched_at}


def pricing_from_gbp_pence(
    amount_pence: Any,
    *,
    fx_snapshot: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    gbp_pence = coerce_pence(amount_pence)
    if gbp_pence is None:
        return None
    fx_rate = _coerce_rate((fx_snapshot or {}).get("rate")) or 1.0
    fetched_at = (fx_snapshot or {}).get("fetched_at")
    if not isinstance(fetched_at, str):
        fetched_at = None
    usd_pence = int(round(gbp_pence * fx_rate))
    return {
        "gbp": {
            "amount_pence": gbp_pence,
            "formatted": f"£{gbp_pence / 100:.2f}",
        },
        "usd": {
            "amount_pence": usd_pence,
            "formatted": f"${usd_pence / 100:.2f}",
        },
        "fx": {
            "rate": fx_rate,
            "fetched_at": fetched_at,
        },
    }
