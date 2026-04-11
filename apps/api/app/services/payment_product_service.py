from __future__ import annotations

import logging
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from threading import Lock
from typing import Any, Iterable

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()
_CLIP_PRICING_CACHE_TTL_SECONDS = 300
_CLIP_PRICING_CACHE_MISS = object()
_clip_pricing_cache: dict[str, tuple[float, dict[str, Any] | None]] = {}
_clip_pricing_cache_lock = Lock()


def _normalize_record(record: dict[str, Any]) -> dict[str, Any]:
    normalized = dict(record)
    if 'active' in normalized:
        normalized['active'] = bool(normalized['active'])
    return normalized


def _request_headers() -> dict[str, str]:
    headers = {'Accept': 'application/json'}
    if settings.payment_system_api_token:
        headers['Authorization'] = f'Bearer {settings.payment_system_api_token}'
    return headers


def _request_url(path: str) -> str | None:
    api_url = settings.payment_system_api_url.strip().rstrip('/')
    if not api_url:
        return None
    return f'{api_url}{path}'


def _extract_item(payload: Any) -> dict[str, Any] | None:
    if not isinstance(payload, dict):
        return None

    item = payload.get('item')
    if isinstance(item, dict):
        return _normalize_record(item)

    if any(key in payload for key in ('pricing', 'price_pence', 'pricePence', 'price_label', 'priceLabel')):
        return _normalize_record(payload)

    return None


def _normalize_clip_id(clip_id: str) -> str:
    return str(clip_id).strip().upper()


def _clip_pricing_timeout_seconds() -> float:
    return max(float(settings.payment_system_timeout_seconds) * 2, 8.0)


def _request_clip_pricing_payload(
    request_url: str,
    *,
    clip_label: str,
    params: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    timeout_seconds = _clip_pricing_timeout_seconds()
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            response = httpx.get(
                request_url,
                headers=_request_headers(),
                params=params,
                timeout=timeout_seconds,
            )
            response.raise_for_status()
            payload = response.json()
            return payload if isinstance(payload, dict) else None
        except httpx.HTTPStatusError as exc:
            last_error = exc
            status_code = getattr(exc.response, "status_code", None)
            if attempt == 0 and status_code in {502, 503, 504}:
                time.sleep(0.25)
                continue
            break
        except (httpx.TimeoutException, httpx.RequestError, ValueError) as exc:
            last_error = exc
            if attempt == 0:
                time.sleep(0.25)
                continue
            break
    logger.warning('Unable to load clip pricing %s from payment system: %s', clip_label, last_error)
    return None


def _fetch_clip_pricing(clip_id: str) -> dict[str, Any] | None:
    request_url = _request_url(f'/api/clips/{clip_id}/pricing')
    if request_url is None:
        return None

    payload = _request_clip_pricing_payload(request_url, clip_label=clip_id)
    if payload is None:
        return None

    return _extract_item(payload)


def _clip_pricing_cache_get(clip_id: str) -> dict[str, Any] | None | object:
    normalized_clip_id = _normalize_clip_id(clip_id)
    if not normalized_clip_id:
        return _CLIP_PRICING_CACHE_MISS

    now = time.monotonic()
    with _clip_pricing_cache_lock:
        cached = _clip_pricing_cache.get(normalized_clip_id)
        if cached is None:
            return _CLIP_PRICING_CACHE_MISS
        expires_at, value = cached
        if expires_at < now:
            _clip_pricing_cache.pop(normalized_clip_id, None)
            return _CLIP_PRICING_CACHE_MISS
        return value


def _clip_pricing_cache_set(clip_id: str, pricing: dict[str, Any] | None) -> None:
    normalized_clip_id = _normalize_clip_id(clip_id)
    if not normalized_clip_id:
        return

    expires_at = time.monotonic() + _CLIP_PRICING_CACHE_TTL_SECONDS
    with _clip_pricing_cache_lock:
        _clip_pricing_cache[normalized_clip_id] = (expires_at, pricing)


def clear_clip_pricing_cache() -> None:
    with _clip_pricing_cache_lock:
        _clip_pricing_cache.clear()


def list_payment_products(active_only: bool = False) -> list[dict[str, Any]]:
    request_url = _request_url('/api/payment-products')
    if request_url is None:
        return []

    try:
        response = httpx.get(
            request_url,
            headers=_request_headers(),
            timeout=settings.payment_system_timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning('Unable to load payment products from payment system: %s', exc)
        return []

    items = payload.get('items')
    if not isinstance(items, list):
        return []

    normalized = [_normalize_record(item) for item in items if isinstance(item, dict)]
    if active_only:
        return [item for item in normalized if item.get('active')]
    return normalized


def get_payment_product(product_id: int | str) -> dict[str, Any] | None:
    try:
        product_id_int = int(product_id)
    except (TypeError, ValueError):
        return None

    request_url = _request_url(f'/api/payment-products/{product_id_int}')
    if request_url is None:
        return None

    try:
        response = httpx.get(
            request_url,
            headers=_request_headers(),
            timeout=settings.payment_system_timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning('Unable to load payment product %s from payment system: %s', product_id_int, exc)
        return None

    return _extract_item(payload)


def get_clip_pricing(clip_id: str) -> dict[str, Any] | None:
    clip_id = _normalize_clip_id(clip_id)
    if not clip_id:
        return None

    cached = _clip_pricing_cache_get(clip_id)
    if cached is not _CLIP_PRICING_CACHE_MISS:
        return cached if isinstance(cached, dict) else None

    pricing = _fetch_clip_pricing(clip_id)
    _clip_pricing_cache_set(clip_id, pricing)
    return pricing


def get_clip_pricings(clip_ids: Iterable[str]) -> dict[str, dict[str, Any]]:
    normalized_clip_ids: list[str] = []
    seen: set[str] = set()
    for clip_id in clip_ids:
        normalized_clip_id = _normalize_clip_id(clip_id)
        if not normalized_clip_id or normalized_clip_id in seen:
            continue
        seen.add(normalized_clip_id)
        normalized_clip_ids.append(normalized_clip_id)

    if not normalized_clip_ids:
        return {}

    pricing_by_id: dict[str, dict[str, Any]] = {}
    missing_clip_ids: list[str] = []
    for clip_id in normalized_clip_ids:
        cached = _clip_pricing_cache_get(clip_id)
        if cached is _CLIP_PRICING_CACHE_MISS:
            missing_clip_ids.append(clip_id)
            continue
        if isinstance(cached, dict):
            pricing_by_id[clip_id] = cached

    if not missing_clip_ids:
        return pricing_by_id

    batch_url = _request_url('/api/clips/pricing')
    if batch_url is not None:
        payload = _request_clip_pricing_payload(
            batch_url,
            clip_label=','.join(missing_clip_ids),
            params={'clip_ids': ','.join(missing_clip_ids)},
        )
        if isinstance(payload, dict):
            items = payload.get('items')
            if isinstance(items, list):
                found_ids: set[str] = set()
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    clip_id = _normalize_clip_id(item.get('clip_id'))
                    if not clip_id:
                        continue
                    found_ids.add(clip_id)
                    _clip_pricing_cache_set(clip_id, item)
                    pricing_by_id[clip_id] = item
                for clip_id in missing_clip_ids:
                    if clip_id not in found_ids:
                        _clip_pricing_cache_set(clip_id, None)
                return pricing_by_id

    if len(missing_clip_ids) == 1:
        clip_id = missing_clip_ids[0]
        pricing = get_clip_pricing(clip_id)
        if isinstance(pricing, dict):
            pricing_by_id[clip_id] = pricing
        return pricing_by_id

    with ThreadPoolExecutor(max_workers=min(8, len(missing_clip_ids))) as executor:
        future_to_clip_id = {executor.submit(get_clip_pricing, clip_id): clip_id for clip_id in missing_clip_ids}
        for future in as_completed(future_to_clip_id):
            clip_id = future_to_clip_id[future]
            try:
                pricing = future.result()
            except Exception as exc:  # pragma: no cover - defensive logging
                logger.warning('Unable to load clip pricing %s from payment system: %s', clip_id, exc)
                pricing = None
            if isinstance(pricing, dict):
                pricing_by_id[clip_id] = pricing

    return pricing_by_id
