from __future__ import annotations

import json
import re
from typing import Iterable


def normalize_tag(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "", value.strip().lower().replace("#", ""))
    return cleaned



def parse_tags(*sources: object) -> list[str]:
    seen: set[str] = set()
    tags: list[str] = []
    for source in sources:
        if source is None:
            continue
        if isinstance(source, list):
            values: Iterable[object] = source
        else:
            text = str(source).strip()
            if not text:
                continue
            if text.startswith("[") and text.endswith("]"):
                try:
                    decoded = json.loads(text)
                except json.JSONDecodeError:
                    decoded = None
                if isinstance(decoded, list):
                    values = decoded
                else:
                    values = re.split(r"[,\s]+", text)
            else:
                values = re.split(r"[,\s]+", text)
        for raw in values:
            tag = normalize_tag(str(raw or ""))
            if tag and tag not in seen:
                seen.add(tag)
                tags.append(tag)
    return tags
