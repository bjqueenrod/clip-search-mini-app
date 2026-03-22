from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class DevUserPayload(BaseModel):
    id: int
    username: str | None = None
    first_name: str | None = Field(default=None, alias="firstName")

    model_config = ConfigDict(populate_by_name=True)


InitDataField = Annotated[
    str | None,
    Field(validation_alias="initData", serialization_alias="initData"),
]

DevUserField = Annotated[
    DevUserPayload | None,
    Field(validation_alias="devUser", serialization_alias="devUser"),
]


class TelegramAuthRequest(BaseModel):
    init_data: InitDataField = None
    dev_user: DevUserField = None

    model_config = ConfigDict(populate_by_name=True)


class AuthUserResponse(BaseModel):
    id: int
    username: str | None = None
    first_name: str | None = Field(default=None, alias="firstName")

    model_config = ConfigDict(populate_by_name=True)


class TelegramAuthResponse(BaseModel):
    ok: bool = True
    user: AuthUserResponse
    session_expires_at: int = Field(alias="sessionExpiresAt")

    model_config = ConfigDict(populate_by_name=True)
