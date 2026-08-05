from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.core.exceptions import AppError
from app.shared.responses import ErrorBody, ErrorDetail, ErrorEnvelope, Meta

_PYDANTIC_TYPE_TO_CONSTRAINT = {
    "missing": "required",
    "string_too_short": "min_length",
    "string_too_long": "max_length",
    "string_pattern_mismatch": "subdomain_format",
    "value_error": "invalid",
    "value_error.email": "email",
}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(_request: Request, exc: AppError) -> JSONResponse:
        body = ErrorEnvelope(
            data=None,
            error=ErrorBody(
                type=exc.error_type,
                message=exc.message,
                details=[ErrorDetail(**detail) for detail in exc.details],
            ),
            meta=Meta.current(include_timestamp=True),
        )
        return JSONResponse(status_code=int(exc.status_code), content=body.model_dump(mode="json"))

    @app.exception_handler(RequestValidationError)
    @app.exception_handler(ValidationError)
    async def handle_validation_error(
        _request: Request,
        exc: RequestValidationError | ValidationError,
    ) -> JSONResponse:
        details = []
        for error in exc.errors():
            field = _normalize_error_location(tuple(error["loc"]))
            details.append(
                ErrorDetail(
                    field=field,
                    constraint=_constraint_key(str(error["type"]), field),
                )
            )
        body = ErrorEnvelope(
            data=None,
            error=ErrorBody(
                type="ValidationError",
                message="Some fields need attention.",
                details=details,
            ),
            meta=Meta.current(include_timestamp=True),
        )
        return JSONResponse(
            status_code=int(HTTPStatus.UNPROCESSABLE_ENTITY),
            content=body.model_dump(mode="json"),
        )


def _normalize_error_location(location: tuple[object, ...]) -> str:
    parts = [str(part) for part in location if part not in ("body", "query", "path")]
    return ".".join(_snake_to_camel(part) for part in parts)


def _snake_to_camel(value: str) -> str:
    head, *tail = value.split("_")
    return head + "".join(part.title() for part in tail)


def _constraint_key(error_type: str, field: str) -> str:
    if field.lower().endswith("email") and error_type == "value_error":
        return "email"
    return _PYDANTIC_TYPE_TO_CONSTRAINT.get(error_type, error_type)
