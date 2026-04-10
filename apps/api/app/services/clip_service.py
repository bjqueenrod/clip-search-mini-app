from __future__ import annotations

from functools import lru_cache
from typing import Any

from sqlalchemy import String, and_, func, literal, or_, select
from sqlalchemy.orm import Session

from app.db.clip_mapping import DEFAULT_SHORT_DESCRIPTION_LENGTH, get_clip_mapping
from app.db.session import engine
from app.schemas.clips import ClipQueryParams
from app.services.payment_product_service import get_payment_product, list_payment_products
from app.services.preview_service import build_preview_assets
from app.services.pricing_service import coerce_pence, fx_snapshot_from_pricing, pricing_from_gbp_pence
from app.utils.bot_links import build_clip_download_url, build_clip_stream_url
from app.core.config import get_settings

settings = get_settings()
from app.utils.duration import format_duration_label, parse_duration_seconds
from app.utils.tags import parse_tags

TOP_SELLER_CLIP_IDS: tuple[str, ...] = (
    "BJQ0005",
    "BJQ0132",
    "BJQ0004",
    "BJQ0139",
    "BJQ0084",
    "BJQ0089",
    "BJQ0060",
    "BJQ0086",
    "BJQ0105",
    "BJQ0083",
)


def _first_column(*values: Any) -> Any:
    for value in values:
        if value is not None:
            return value
    return None


def _text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def _price_from_pence(value: Any) -> float | None:
    pence = coerce_pence(value)
    if pence is None or pence <= 0:
        return None
    return round(pence / 100.0, 2)


def _payment_product_key(data: dict[str, Any]) -> str | None:
    for key in ("payment_product_id", "product_id", "productId"):
        value = data.get(key)
        if value in (None, ""):
            continue
        text = str(value).strip()
        if text:
            return text
    return None


def _payment_product_map(product_ids: set[str]) -> dict[str, dict[str, Any]]:
    if not product_ids:
        return {}

    products = list_payment_products(active_only=False)
    mapped = {str(item.get("id")): item for item in products if isinstance(item, dict) and item.get("id") is not None}
    missing = [product_id for product_id in product_ids if product_id not in mapped]
    for product_id in missing:
        item = get_payment_product(product_id)
        if item is not None and item.get("id") is not None:
            mapped[str(item.get("id"))] = item
    return mapped


def _payment_product_pricing(
    product: dict[str, Any] | None,
    *,
    fallback_pence: Any = None,
    fallback_label: str | None = None,
) -> tuple[float | None, int | None, str | None, dict[str, Any] | None]:
    if not isinstance(product, dict):
        return None, coerce_pence(fallback_pence), fallback_label, None

    pricing = product.get("pricing") if isinstance(product.get("pricing"), dict) else None
    price_pence = coerce_pence(product.get("price_pence") or product.get("pricePence"))
    if price_pence is None and isinstance(pricing, dict):
        gbp_bucket = pricing.get("gbp") if isinstance(pricing.get("gbp"), dict) else {}
        price_pence = coerce_pence(gbp_bucket.get("amount_pence") or gbp_bucket.get("amountPence"))
    if price_pence is None:
        price_pence = coerce_pence(fallback_pence)

    if pricing is None and price_pence is not None:
        pricing = pricing_from_gbp_pence(price_pence, fx_snapshot=_fx_snapshot())

    price = _price_from_pence(price_pence)
    price_label = _text(product.get("price_label") or product.get("priceLabel"))
    if not price_label and isinstance(pricing, dict):
        gbp_bucket = pricing.get("gbp") if isinstance(pricing.get("gbp"), dict) else {}
        price_label = _text(gbp_bucket.get("formatted"))
    if not price_label:
        price_label = fallback_label

    return price, price_pence, price_label, pricing


@lru_cache(maxsize=1)
def _fx_snapshot() -> dict[str, Any]:
    for product in list_payment_products(active_only=True):
        if not isinstance(product, dict):
            continue
        snapshot = fx_snapshot_from_pricing(product.get("pricing") if isinstance(product.get("pricing"), dict) else None)
        if snapshot:
            return snapshot
    return {"rate": 1.0, "fetched_at": None}



def _short_description(description: str | None) -> str | None:
    if not description:
        return None
    value = description.strip()
    if len(value) <= DEFAULT_SHORT_DESCRIPTION_LENGTH:
        return value
    return value[: DEFAULT_SHORT_DESCRIPTION_LENGTH - 1].rstrip() + "..."



def _coalesce_text(*columns: Any):
    valid = [column for column in columns if column is not None]
    if not valid:
        return literal("")
    return func.coalesce(*valid, literal(""))



def _sort_expression(sort: str, mapping):
    created_at = mapping.get("created_at")
    title = mapping.get("title")
    price = _first_column(mapping.get("price_pence"), mapping.get("download_price_pence"))
    clip_id = mapping.get("clip_id")
    options = {
        "newest": created_at.desc() if created_at is not None else clip_id.desc(),
        "oldest": created_at.asc() if created_at is not None else clip_id.asc(),
        "price_asc": price.asc() if price is not None else clip_id.asc(),
        "price_desc": price.desc() if price is not None else clip_id.desc(),
        "title_asc": title.asc() if title is not None else clip_id.asc(),
        "title_desc": title.desc() if title is not None else clip_id.desc(),
    }
    return options.get(sort, options["newest"])



def _build_filters(params: ClipQueryParams, mapping):
    filters = []
    active_col = mapping.get("active")
    if active_col is not None:
        filters.append(active_col == 1)

    if params.q:
        needle = f"%{params.q.strip().lower()}%"
        clip_id = func.lower(_coalesce_text(mapping.get("clip_id")).cast(String))
        title = func.lower(_coalesce_text(mapping.get("title")).cast(String))
        description = func.lower(_coalesce_text(mapping.get("description")).cast(String))
        category = func.lower(_coalesce_text(mapping.get("category")).cast(String))
        keywords = func.lower(_coalesce_text(mapping.get("keywords")).cast(String))
        hashtags = func.lower(_coalesce_text(mapping.get("hashtags")).cast(String))
        filters.append(
            or_(
                clip_id.like(needle),
                title.like(needle),
                description.like(needle),
                category.like(needle),
                keywords.like(needle),
                hashtags.like(needle),
            )
        )

    if params.category and mapping.get("category") is not None:
        filters.append(func.lower(mapping.get("category")) == params.category.strip().lower())

    parsed_tags = parse_tags(params.tags) if params.tags else []
    for tag in parsed_tags:
        tag_needle = f"%{tag.lower()}%"
        filters.append(
            or_(
                func.lower(_coalesce_text(mapping.get("keywords")).cast(String)).like(tag_needle),
                func.lower(_coalesce_text(mapping.get("hashtags")).cast(String)).like(tag_needle),
            )
        )

    return filters



def _build_preview(preview_id: str | None, *, include_embed_url: bool) -> dict[str, Any]:
    try:
        return build_preview_assets(
            preview_id,
            include_embed_url=include_embed_url,
            resolve_thumbnail_metadata=include_embed_url,
            verify_embed_access=include_embed_url,
        )
    except TypeError:
        # Test fixtures may patch the helper with the older single-argument signature.
        return build_preview_assets(preview_id)


def _row_to_item(
    row: Any,
    *,
    include_embed_url: bool = True,
    fx_snapshot: dict[str, Any] | None = None,
) -> dict[str, Any]:
    data = dict(row._mapping)
    clip_id = str(data.get("clip_id") or data.get("id") or "")
    tags = parse_tags(data.get("keywords"), data.get("hashtags"))
    preview = _build_preview(data.get("bunny_stream_preview_id"), include_embed_url=include_embed_url)
    custom_thumbnail_url = (
        str(data.get("thumbnail_url") or data.get("custom_thumbnail_url") or "").strip() or None
    )
    description = str(data.get("description") or "").strip() or None
    base_pence = coerce_pence(data.get("price_pence"))
    watch_pence = coerce_pence(data.get("watch_price_pence")) or base_pence
    download_pence = coerce_pence(data.get("download_price_pence")) or base_pence
    base_price = _price_from_pence(base_pence)
    stream_price = _price_from_pence(watch_pence) or base_price
    download_price = _price_from_pence(download_pence) or base_price
    pricing = pricing_from_gbp_pence(base_pence, fx_snapshot=fx_snapshot)
    watch_pricing = pricing_from_gbp_pence(watch_pence, fx_snapshot=fx_snapshot)
    download_pricing = pricing_from_gbp_pence(download_pence, fx_snapshot=fx_snapshot)
    return {
        "id": clip_id,
        "title": str(data.get("title") or clip_id),
        "shortDescription": _short_description(description),
        "description": description,
        "price": base_price,
        "pricing": pricing,
        "streamPrice": stream_price,
        "streamPricing": watch_pricing,
        "downloadPrice": download_price,
        "downloadPricing": download_pricing,
        "watchPricing": watch_pricing,
        "durationSeconds": parse_duration_seconds(data.get("duration")),
        "durationLabel": format_duration_label(data.get("duration")),
        "thumbnailUrl": custom_thumbnail_url or preview.get("thumbnailUrl"),
        "previewWebpUrl": preview.get("previewWebpUrl"),
        "previewEmbedUrl": preview.get("previewEmbedUrl"),
        "previewType": preview.get("previewType"),
        "category": str(data.get("category") or "").strip() or None,
        "tags": tags,
        "botStreamUrl": build_clip_stream_url(clip_id),
        "botDownloadUrl": build_clip_download_url(clip_id),
        "watchProductId": settings.clips_watch_product_id,
        "downloadProductId": settings.clips_download_product_id,
    }



def search_clips(db: Session, params: ClipQueryParams) -> dict[str, Any]:
    mapping = get_clip_mapping(engine)
    table = mapping.table
    filters = _build_filters(params, mapping)
    page = max(1, params.page)
    limit = max(1, min(params.limit, 50))
    offset = (page - 1) * limit

    query = select(table)
    count_query = select(func.count()).select_from(table)
    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))
    query = query.order_by(_sort_expression(params.sort, mapping)).offset(offset).limit(limit)

    total = int(db.execute(count_query).scalar_one())
    rows = db.execute(query).all()
    fx_snapshot = _fx_snapshot()
    items = [_row_to_item(row, include_embed_url=False, fx_snapshot=fx_snapshot) for row in rows]

    categories: list[str] = []
    category_col = mapping.get("category")
    if category_col is not None and page == 1:
        category_rows = db.execute(
            select(category_col).where(and_(*filters)) if filters else select(category_col)
        ).scalars().all()
        categories = sorted({str(value).strip() for value in category_rows if str(value or "").strip()})

    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "hasMore": offset + len(items) < total,
        "categories": categories,
    }



def get_clip_hashtags(db: Session, *, limit: int = 250) -> dict[str, Any]:
    mapping = get_clip_mapping(engine)
    table = mapping.table
    stmt = select(table)
    active_col = mapping.get("active")
    if active_col is not None:
        stmt = stmt.where(active_col == 1)

    rows = db.execute(stmt).all()
    tag_counts: dict[str, int] = {}
    for row in rows:
        data = dict(row._mapping)
        for tag in parse_tags(data.get("keywords"), data.get("hashtags")):
            tag_counts[tag] = tag_counts.get(tag, 0) + 1

    items = [
        {"tag": tag, "count": count}
        for tag, count in sorted(tag_counts.items(), key=lambda item: (-item[1], item[0]))
    ][: max(1, min(limit, 500))]
    return {"items": items}


def get_clip_detail(db: Session, clip_id: str) -> dict[str, Any] | None:
    mapping = get_clip_mapping(engine)
    table = mapping.table
    stmt = select(table).where(table.c.clip_id == clip_id)
    active_col = mapping.get("active")
    if active_col is not None:
        stmt = stmt.where(active_col == 1)
    stmt = stmt.limit(1)
    row = db.execute(stmt).first()
    if row is None:
        return None
    item = _row_to_item(row, fx_snapshot=_fx_snapshot())
    return item


def get_top_seller_clips(db: Session) -> dict[str, Any]:
    mapping = get_clip_mapping(engine)
    table = mapping.table
    clip_id_col = mapping.get("clip_id")
    if clip_id_col is None:
        return {
            "items": [],
            "page": 1,
            "limit": len(TOP_SELLER_CLIP_IDS),
            "total": 0,
            "hasMore": False,
            "categories": [],
        }

    stmt = select(table).where(clip_id_col.in_(TOP_SELLER_CLIP_IDS))
    active_col = mapping.get("active")
    if active_col is not None:
        stmt = stmt.where(active_col == 1)

    rows = db.execute(stmt).all()
    payment_product_ids: set[str] = {str(settings.clips_watch_product_id), str(settings.clips_download_product_id)}
    row_data_by_id: dict[str, dict[str, Any]] = {}
    row_by_id: dict[str, Any] = {}
    for row in rows:
        data = dict(row._mapping)
        clip_id = str(data.get("clip_id") or data.get("id") or "").upper()
        if not clip_id:
            continue
        row_data_by_id[clip_id] = data
        row_by_id[clip_id] = row
        payment_product_id = _payment_product_key(data)
        if payment_product_id:
            payment_product_ids.add(payment_product_id)

    payment_products_by_id = _payment_product_map(payment_product_ids)
    item_map: dict[str, dict[str, Any]] = {}
    for clip_id in TOP_SELLER_CLIP_IDS:
        row_data = row_data_by_id.get(clip_id)
        if not row_data:
            continue
        row = row_by_id.get(clip_id)
        if row is None:
            continue
        item = _row_to_item(row, include_embed_url=False, fx_snapshot=_fx_snapshot())
        clip_product = payment_products_by_id.get(_payment_product_key(row_data) or "")
        price, price_pence, price_label, pricing = _payment_product_pricing(
            clip_product,
            fallback_pence=row_data.get("price_pence"),
            fallback_label=item.get("priceLabel"),
        )
        if price is not None:
            item["price"] = price
        if price_pence is not None:
            item["pricePence"] = price_pence
        if price_label:
            item["priceLabel"] = price_label
        if pricing is not None:
            item["pricing"] = pricing

        watch_product = payment_products_by_id.get(str(settings.clips_watch_product_id))
        stream_price, stream_price_pence, stream_price_label, stream_pricing = _payment_product_pricing(
            watch_product,
            fallback_pence=row_data.get("watch_price_pence") or row_data.get("price_pence"),
            fallback_label=item.get("priceLabel"),
        )
        if stream_price is not None:
            item["streamPrice"] = stream_price
        if stream_price_pence is not None:
            item["streamPricePence"] = stream_price_pence
        if stream_price_label:
            item["streamPriceLabel"] = stream_price_label
        if stream_pricing is not None:
            item["streamPricing"] = stream_pricing
            item["watchPricing"] = stream_pricing

        download_product = payment_products_by_id.get(str(settings.clips_download_product_id))
        download_price, download_price_pence, download_price_label, download_pricing = _payment_product_pricing(
            download_product,
            fallback_pence=row_data.get("download_price_pence") or row_data.get("price_pence"),
            fallback_label=item.get("priceLabel"),
        )
        if download_price is not None:
            item["downloadPrice"] = download_price
        if download_price_pence is not None:
            item["downloadPricePence"] = download_price_pence
        if download_price_label:
            item["downloadPriceLabel"] = download_price_label
        if download_pricing is not None:
            item["downloadPricing"] = download_pricing

        item_map[clip_id] = item
    items = [item_map[clip_id] for clip_id in TOP_SELLER_CLIP_IDS if clip_id in item_map]
    return {
        "items": items,
        "page": 1,
        "limit": len(TOP_SELLER_CLIP_IDS),
        "total": len(items),
        "hasMore": False,
        "categories": [],
    }


def get_new_clips(db: Session, *, limit: int = 10) -> dict[str, Any]:
    mapping = get_clip_mapping(engine)
    table = mapping.table
    clip_id_col = mapping.get("clip_id")
    if clip_id_col is None:
        return {
            "items": [],
            "page": 1,
            "limit": limit,
            "total": 0,
            "hasMore": False,
            "categories": [],
        }

    stmt = select(table)
    active_col = mapping.get("active")
    if active_col is not None:
        stmt = stmt.where(active_col == 1)
    stmt = stmt.order_by(clip_id_col.desc()).limit(max(1, min(limit, 20)))

    rows = db.execute(stmt).all()
    fx_snapshot = _fx_snapshot()
    items = [_row_to_item(row, include_embed_url=False, fx_snapshot=fx_snapshot) for row in rows]
    return {
        "items": items,
        "page": 1,
        "limit": len(items) or limit,
        "total": len(items),
        "hasMore": False,
        "categories": [],
    }
