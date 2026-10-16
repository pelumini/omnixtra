from unittest.mock import AsyncMock, MagicMock
from uuid import UUID

import pytest

from app.core.config import get_settings
from app.core.context import clear_tenant_id, set_tenant_id
from app.core.exceptions import ValidationAppError
from app.courses.models import Course
from app.courses.schemas import MediaConfirmRequest, MediaPresignRequest
from app.courses.services import (
    _safe_filename,
    _validate_media,
    confirm_media_upload,
    presign_media_upload,
)

TENANT_ID = UUID("00000000-0000-0000-0000-000000000001")
COURSE_ID = UUID("00000000-0000-0000-0000-000000000010")


@pytest.fixture(autouse=True)
def tenant_context() -> None:
    set_tenant_id(str(TENANT_ID))
    yield
    clear_tenant_id()


def test_safe_filename_discards_client_paths() -> None:
    assert _safe_filename("../../another-tenant/Quarterly Plan.pdf") == "Quarterly-Plan.pdf"
    assert "/" not in _safe_filename("tenant/secret.png")


@pytest.mark.parametrize(
    ("kind", "content_type"),
    [
        ("image", "image/png"),
        ("thumbnail", "image/jpeg"),
        ("video", "video/mp4"),
        ("audio", "audio/mpeg"),
        ("file", "application/pdf"),
    ],
)
def test_media_content_type_allow_list(kind: str, content_type: str) -> None:
    _validate_media(kind, content_type, 1)


def test_media_rejects_kind_mismatch() -> None:
    with pytest.raises(ValidationAppError, match="not allowed"):
        _validate_media("image", "video/mp4", 1)


def test_media_rejects_oversize_file() -> None:
    with pytest.raises(ValidationAppError, match="upload limit"):
        _validate_media("image", "image/png", get_settings().storage_max_upload_bytes + 1)


@pytest.mark.anyio
async def test_presign_builds_server_scoped_key(monkeypatch: pytest.MonkeyPatch) -> None:
    session = AsyncMock()
    monkeypatch.setattr("app.courses.services.require_course", AsyncMock())
    capacity = AsyncMock()
    monkeypatch.setattr("app.courses.services._ensure_media_capacity", capacity)
    presign = AsyncMock(return_value="http://storage/upload")
    monkeypatch.setattr("app.courses.services.StorageClient.presign_put", presign)

    response = await presign_media_upload(
        session,
        COURSE_ID,
        MediaPresignRequest(
            byte_size=128,
            content_type="image/png",
            filename="../../other-tenant/hero image.png",
            kind="image",
        ),
    )

    assert response.upload_url == "http://storage/upload"
    assert response.object_key.startswith(f"tenants/{TENANT_ID}/courses/{COURSE_ID}/")
    assert response.object_key.endswith("/hero-image.png")
    assert "other-tenant" not in response.object_key
    capacity.assert_awaited_once_with(session, 128)


@pytest.mark.anyio
async def test_confirm_rejects_head_metadata_mismatch(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    asset_id = UUID("00000000-0000-0000-0000-000000000099")
    object_key = f"tenants/{TENANT_ID}/courses/{COURSE_ID}/{asset_id}/hero.png"
    monkeypatch.setattr(
        "app.courses.services.require_course",
        AsyncMock(return_value=Course(id=COURSE_ID, title="Course", slug="course", status="draft")),
    )
    monkeypatch.setattr(
        "app.courses.services.StorageClient.head",
        AsyncMock(return_value={"ContentLength": 99, "ContentType": "image/png"}),
    )
    capacity = AsyncMock()
    monkeypatch.setattr("app.courses.services._ensure_media_capacity", capacity)

    with pytest.raises(ValidationAppError, match="does not match"):
        await confirm_media_upload(
            AsyncMock(),
            COURSE_ID,
            MediaConfirmRequest(
                object_key=object_key,
                kind="image",
                content_type="image/png",
                byte_size=100,
            ),
        )

    capacity.assert_not_awaited()


@pytest.mark.anyio
async def test_confirm_creates_asset_and_rechecks_quota(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    asset_id = UUID("00000000-0000-0000-0000-000000000099")
    object_key = f"tenants/{TENANT_ID}/courses/{COURSE_ID}/{asset_id}/hero.png"
    session = MagicMock()
    session.scalar = AsyncMock(return_value=None)
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    monkeypatch.setattr(
        "app.courses.services.require_course",
        AsyncMock(return_value=Course(id=COURSE_ID, title="Course", slug="course", status="draft")),
    )
    monkeypatch.setattr(
        "app.courses.services.StorageClient.head",
        AsyncMock(return_value={"ContentLength": 100, "ContentType": "image/png"}),
    )
    monkeypatch.setattr(
        "app.courses.services.StorageClient.presign_get",
        AsyncMock(return_value="http://storage/read"),
    )
    capacity = AsyncMock()
    monkeypatch.setattr("app.courses.services._ensure_media_capacity", capacity)

    response = await confirm_media_upload(
        session,
        COURSE_ID,
        MediaConfirmRequest(
            object_key=object_key,
            kind="image",
            content_type="image/png",
            byte_size=100,
            original_filename="hero.png",
        ),
    )

    assert response.id == asset_id
    assert response.object_key == object_key
    assert response.delivery_url == "http://storage/read"
    capacity.assert_awaited_once_with(session, 100)
    session.add.assert_called()
    session.commit.assert_awaited_once()
