import ast
from pathlib import Path
from sys import stderr
from typing import TypeGuard

MIGRATIONS_DIR = Path("migrations/versions")
MIN_CREATE_TABLE_ARGS = 2


def main() -> int:
    failures = find_missing_rls_helpers(MIGRATIONS_DIR)
    for failure in failures:
        stderr.write(f"{failure}\n")
    return 1 if failures else 0


def find_missing_rls_helpers(migrations_dir: Path) -> list[str]:
    failures: list[str] = []
    for migration_path in sorted(migrations_dir.glob("*.py")):
        tree = ast.parse(migration_path.read_text(encoding="utf-8"))
        tenant_owned_tables = _tenant_owned_create_tables(tree)
        if tenant_owned_tables and not _calls_function(tree, "enable_tenant_rls"):
            table_list = ", ".join(sorted(tenant_owned_tables))
            failures.append(
                f"{migration_path}: tenant-owned table(s) missing RLS helper: {table_list}",
            )
    return failures


def _tenant_owned_create_tables(tree: ast.AST) -> set[str]:
    tables: set[str] = set()
    for node in ast.walk(tree):
        if not _is_op_call(node, "create_table"):
            continue
        if len(node.args) < MIN_CREATE_TABLE_ARGS or not isinstance(node.args[0], ast.Constant):
            continue
        table_name = node.args[0].value
        if isinstance(table_name, str) and _has_tenant_id_column(node):
            tables.add(table_name)
    return tables


def _has_tenant_id_column(node: ast.Call) -> bool:
    for arg in node.args[1:]:
        if not isinstance(arg, ast.Call):
            continue
        if len(arg.args) < 1:
            continue
        first_arg = arg.args[0]
        if isinstance(first_arg, ast.Constant) and first_arg.value == "tenant_id":
            return True
    return False


def _calls_function(tree: ast.AST, function_name: str) -> bool:
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and _call_name(node.func) == function_name:
            return True
    return False


def _is_op_call(node: ast.AST, method_name: str) -> TypeGuard[ast.Call]:
    if not isinstance(node, ast.Call):
        return False
    return (
        isinstance(node.func, ast.Attribute)
        and node.func.attr == method_name
        and isinstance(node.func.value, ast.Name)
        and node.func.value.id == "op"
    )


def _call_name(node: ast.expr) -> str | None:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return node.attr
    return None


if __name__ == "__main__":
    raise SystemExit(main())
