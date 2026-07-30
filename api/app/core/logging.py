import logging
from collections.abc import Mapping, MutableMapping
from typing import Any

import structlog
from structlog.typing import WrappedLogger

from app.core.config import Settings
from app.core.context import get_request_id, get_tenant_id


def add_context(
    _logger: WrappedLogger,
    _method_name: str,
    event_dict: MutableMapping[str, Any],
) -> Mapping[str, Any]:
    event_dict["request_id"] = get_request_id()
    event_dict["tenant_id"] = get_tenant_id()
    return event_dict


def configure_logging(_settings: Settings) -> None:
    structlog.configure(
        processors=[
            add_context,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        cache_logger_on_first_use=True,
    )
