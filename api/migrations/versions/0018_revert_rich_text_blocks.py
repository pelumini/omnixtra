"""Normalize rich-text course blocks to plain markdown.

Revision ID: 0018_revert_rich_text
Revises: 0017_course_builder_metadata
"""

import json
from collections.abc import Sequence
from typing import Any

import sqlalchemy as sa
from alembic import op

revision: str = "0018_revert_rich_text"
down_revision: str | None = "0017_course_builder_metadata"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def doc_to_markdown(value: object) -> str:
    if not isinstance(value, dict):
        return ""
    if value.get("type") == "hardBreak":
        return "\n"
    text = value.get("text")
    if isinstance(text, str):
        return text
    content = value.get("content")
    if not isinstance(content, list):
        return ""
    parts = [doc_to_markdown(child) for child in content]
    inline_types = {"text", "hardBreak"}
    separator = (
        ""
        if all(isinstance(child, dict) and child.get("type") in inline_types for child in content)
        else "\n"
    )
    return separator.join(part for part in parts if part)


def normalized_content(content: dict[str, Any]) -> dict[str, str]:
    markdown = content.get("markdown")
    if not isinstance(markdown, str) or not markdown:
        markdown = doc_to_markdown(content.get("doc"))
    return {"type": "text", "markdown": markdown}


def upgrade() -> None:
    connection = op.get_bind()
    update_statement = sa.text(
        "UPDATE course_blocks SET content = CAST(:content AS jsonb) WHERE id = :id"
    )
    tenant_ids = list(connection.execute(sa.text("SELECT id::text FROM tenants")).scalars())
    try:
        for tenant_id in tenant_ids:
            connection.execute(
                sa.text("SELECT set_config('app.current_tenant_id', :tenant_id, true)"),
                {"tenant_id": tenant_id},
            )
            rows = list(
                connection.execute(
                    sa.text(
                        """
                        SELECT id, content
                        FROM course_blocks
                        WHERE tenant_id = CAST(:tenant_id AS uuid)
                          AND content->>'type' = 'text'
                          AND content ? 'doc'
                        """
                    ),
                    {"tenant_id": tenant_id},
                ).mappings()
            )
            for row in rows:
                connection.execute(
                    update_statement,
                    {
                        "content": json.dumps(normalized_content(row["content"])),
                        "id": row["id"],
                    },
                )
    finally:
        connection.execute(sa.text("SELECT set_config('app.current_tenant_id', '', true)"))


def downgrade() -> None:
    """No-op: normalized rich-text structure cannot be reconstructed from plain text."""
