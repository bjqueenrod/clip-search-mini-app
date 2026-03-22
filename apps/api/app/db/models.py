from __future__ import annotations

from sqlalchemy import BigInteger, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SessionAudit(Base):
    __tablename__ = "mini_app_session_audits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    telegram_user_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    source: Mapped[str] = mapped_column(String(32), default="telegram")
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
