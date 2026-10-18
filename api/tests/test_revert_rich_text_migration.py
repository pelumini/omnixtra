import importlib


def test_rich_text_migration_flattens_doc_and_prefers_existing_markdown() -> None:
    migration = importlib.import_module("migrations.versions.0018_revert_rich_text_blocks")
    doc = {
        "type": "doc",
        "content": [
            {"type": "heading", "content": [{"type": "text", "text": "Welcome"}]},
            {
                "type": "paragraph",
                "content": [
                    {"type": "text", "text": "First "},
                    {"type": "text", "text": "lesson"},
                ],
            },
        ],
    }

    assert migration.normalized_content({"type": "text", "doc": doc}) == {
        "type": "text",
        "markdown": "Welcome\nFirst lesson",
    }
    assert migration.normalized_content({"type": "text", "markdown": "Keep me", "doc": doc}) == {
        "type": "text",
        "markdown": "Keep me",
    }
