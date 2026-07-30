from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.core.exceptions import AppError
from app.shared.responses import ErrorBody, ErrorDetail, ErrorEnvelope, Meta


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
        details = [
            ErrorDetail(
                field=".".join(str(part) for part in error["loc"]),
                constraint=error["type"],
            )
            for error in exc.errors()
        ]
        body = ErrorEnvelope(
            data=None,
            error=ErrorBody(
                type="ValidationError",
                message="request validation failed",
                details=details,
            ),
            meta=Meta.current(include_timestamp=True),
        )
        return JSONResponse(status_code=400, content=body.model_dump(mode="json"))
