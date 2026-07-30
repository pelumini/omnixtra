from typing import Final
from uuid import UUID

from sqlalchemy import Delete, Select, Update, event
from sqlalchemy.orm import ORMExecuteState, Session, with_loader_criteria
from sqlalchemy.sql import Executable
from sqlalchemy.sql.schema import Table

from app.core.context import get_tenant_id
from app.shared.models import TenantOwnedMixin
from app.tenancy.context import MissingTenantContextError

TENANT_FILTER_BYPASS_OPTION: Final[str] = "omnixtra_bypass_tenant_filter"


def register_tenant_orm_hooks(session_class: type[Session]) -> None:
    event.listen(session_class, "do_orm_execute", _add_tenant_criteria)
    event.listen(session_class, "before_flush", _populate_tenant_ids)


def apply_tenant_criteria(statement: Executable, tenant_id: UUID) -> Executable:
    if isinstance(statement, Select):
        return statement.options(
            with_loader_criteria(
                TenantOwnedMixin,
                lambda cls: cls.tenant_id == tenant_id,
                include_aliases=True,
            ),
        )

    if isinstance(statement, (Update, Delete)) and _targets_tenant_owned_table(statement):
        return statement.where(statement.table.c.tenant_id == tenant_id)

    return statement


def populate_tenant_id(instance: object, tenant_id: UUID) -> None:
    if isinstance(instance, TenantOwnedMixin) and getattr(instance, "tenant_id", None) is None:
        instance.tenant_id = tenant_id


def current_tenant_uuid() -> UUID:
    tenant_id = get_tenant_id()
    if tenant_id is None:
        msg = "tenant context is required"
        raise MissingTenantContextError(msg)
    return UUID(tenant_id)


def _add_tenant_criteria(execute_state: ORMExecuteState) -> None:
    if execute_state.execution_options.get(TENANT_FILTER_BYPASS_OPTION) is True:
        return

    statement = execute_state.statement
    targets_tenant_owned = (
        execute_state.is_select and _select_targets_tenant_owned(statement)
    ) or (
        (execute_state.is_update or execute_state.is_delete)
        and isinstance(statement, (Update, Delete))
        and _targets_tenant_owned_table(statement)
    )

    if targets_tenant_owned:
        execute_state.statement = apply_tenant_criteria(
            execute_state.statement,
            current_tenant_uuid(),
        )


def _populate_tenant_ids(session: Session, _flush_context: object, _instances: object) -> None:
    tenant_owned_instances = [
        instance for instance in session.new if isinstance(instance, TenantOwnedMixin)
    ]
    if not tenant_owned_instances:
        return
    tenant_id = current_tenant_uuid()
    for instance in tenant_owned_instances:
        populate_tenant_id(instance, tenant_id)


def _targets_tenant_owned_table(statement: Update | Delete) -> bool:
    target_table = statement.table
    return isinstance(target_table, Table) and "tenant_id" in target_table.columns


def _select_targets_tenant_owned(statement: object) -> bool:
    if not isinstance(statement, Select):
        return False

    for description in statement.column_descriptions:
        entity = description.get("entity")
        if isinstance(entity, type) and issubclass(entity, TenantOwnedMixin):
            return True
    return False
