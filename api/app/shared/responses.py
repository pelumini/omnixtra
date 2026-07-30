from datetime import UTC, datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

from app.core.context import get_request_id

DataT = TypeVar("DataT")


class Meta(BaseModel):
    request_id: str
    timestamp: datetime | None = None

    @classmethod
    def current(cls, *, include_timestamp: bool = False) -> "Meta":
        return cls(
            request_id=get_request_id(),
            timestamp=datetime.now(UTC) if include_timestamp else None,
        )


class ErrorDetail(BaseModel):
    field: str
    constraint: str


class ErrorBody(BaseModel):
    type: str
    message: str
    details: list[ErrorDetail]


class Envelope(BaseModel, Generic[DataT]):
    model_config = ConfigDict(arbitrary_types_allowed=True)

    data: DataT
    error: None
    meta: Meta


class ErrorEnvelope(BaseModel):
    data: None
    error: ErrorBody
    meta: Meta
