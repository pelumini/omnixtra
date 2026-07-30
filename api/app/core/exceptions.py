from http import HTTPStatus
from typing import Any


class AppError(Exception):
    status_code = HTTPStatus.INTERNAL_SERVER_ERROR
    error_type = "InternalError"

    def __init__(self, message: str, details: list[dict[str, Any]] | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details or []


class ValidationAppError(AppError):
    status_code = HTTPStatus.BAD_REQUEST
    error_type = "ValidationError"


class AuthenticationError(AppError):
    status_code = HTTPStatus.UNAUTHORIZED
    error_type = "AuthenticationError"


class AuthorizationError(AppError):
    status_code = HTTPStatus.FORBIDDEN
    error_type = "AuthorizationError"


class NotFoundError(AppError):
    status_code = HTTPStatus.NOT_FOUND
    error_type = "NotFoundError"


class ConflictError(AppError):
    status_code = HTTPStatus.CONFLICT
    error_type = "ConflictError"


class RateLimitError(AppError):
    status_code = HTTPStatus.TOO_MANY_REQUESTS
    error_type = "RateLimitError"
