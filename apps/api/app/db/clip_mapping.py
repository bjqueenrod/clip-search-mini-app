from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from typing import Any

from sqlalchemy import MetaData, Table, inspect
from sqlalchemy.engine import Engine
from sqlalchemy.sql.schema import Column


@dataclass(slots=True)
class ClipFieldMapping:
    table: Table
    columns: set[str]

    def get(self, name: str) -> Column[Any] | None:
        return self.table.c.get(name)

    def has(self, name: str) -> bool:
        return name in self.columns


@lru_cache(maxsize=1)
def get_clip_mapping(engine: Engine) -> ClipFieldMapping:
    metadata = MetaData()
    table = Table("clips", metadata, autoload_with=engine)
    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("clips")}
    return ClipFieldMapping(table=table, columns=columns)


DEFAULT_SHORT_DESCRIPTION_LENGTH = 120
