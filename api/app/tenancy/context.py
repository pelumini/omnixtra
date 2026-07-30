from app.core.context import get_tenant_id
from app.core.exceptions import AppError


class MissingTenantContextError(AppError):
    error_type = "MissingTenantContextError"


def require_tenant_id() -> str:
    tenant_id = get_tenant_id()
    if tenant_id is None:
        msg = "tenant context is required"
        raise MissingTenantContextError(msg)
    return tenant_id
