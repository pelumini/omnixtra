from datetime import timedelta
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID

import pytest

from app.core.config import get_settings
from app.core.context import clear_tenant_id, set_tenant_id
from app.core.exceptions import ValidationAppError
from app.courses.models import Course, CourseMediaAsset
from app.courses.schemas import MediaConfirmRequest, MediaPresignRequest
from app.courses.services import (
    _safe_filename,
    _validate_media,
    confirm_media_upload,
    media_delivery_url,
    presign_media_upload,
    publish_course,
    reclaim_orphaned_course_media,
)
from app.shared.models import utc_now

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
    monkeypatch.setattr("app.courses.services.reclaim_orphaned_course_media", AsyncMock())
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
    reclaim = AsyncMock()
    monkeypatch.setattr("app.courses.services.reclaim_orphaned_course_media", reclaim)
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
    calls = MagicMock()
    calls.attach_mock(reclaim, "reclaim")
    calls.attach_mock(capacity, "capacity")

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
    reclaim.assert_awaited_once_with(session, COURSE_ID)
    assert [entry[0] for entry in calls.mock_calls[:2]] == ["reclaim", "capacity"]
    session.add.assert_called()
    session.commit.assert_awaited_once()


@pytest.mark.anyio
async def test_reclaim_keeps_referenced_and_recent_assets_and_deletes_old_orphan(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    referenced_id = UUID("00000000-0000-0000-0000-000000000091")
    thumbnail_id = UUID("00000000-0000-0000-0000-000000000092")
    recent_id = UUID("00000000-0000-0000-0000-000000000093")
    orphan_id = UUID("00000000-0000-0000-0000-000000000094")
    prefix = f"tenants/{TENANT_ID}/courses/{COURSE_ID}"
    thumbnail_key = f"{prefix}/{thumbnail_id}/thumbnail.png"
    old = utc_now() - timedelta(minutes=20)
    assets = [
        CourseMediaAsset(
            id=referenced_id,
            tenant_id=TENANT_ID,
            course_id=COURSE_ID,
            object_key=f"{prefix}/{referenced_id}/block.png",
            file_name="block.png",
            content_type="image/png",
            byte_size=10,
            created_at=old,
        ),
        CourseMediaAsset(
            id=thumbnail_id,
            tenant_id=TENANT_ID,
            course_id=COURSE_ID,
            object_key=thumbnail_key,
            file_name="thumbnail.png",
            content_type="image/png",
            byte_size=20,
            created_at=old,
        ),
        CourseMediaAsset(
            id=recent_id,
            tenant_id=TENANT_ID,
            course_id=COURSE_ID,
            object_key=f"{prefix}/{recent_id}/recent.png",
            file_name="recent.png",
            content_type="image/png",
            byte_size=30,
            created_at=utc_now(),
        ),
        CourseMediaAsset(
            id=orphan_id,
            tenant_id=TENANT_ID,
            course_id=COURSE_ID,
            object_key=f"{prefix}/{orphan_id}/orphan.png",
            file_name="orphan.png",
            content_type="image/png",
            byte_size=40,
            created_at=old,
        ),
    ]
    session = MagicMock()
    reference_result = MagicMock()
    reference_result.all.return_value = [
        ("asset_id", str(referenced_id)),
        ("asset_id", "not-a-uuid"),
        ("object_key", thumbnail_key),
        ("object_key", "https://example.com/external.png"),
    ]
    session.execute = AsyncMock(return_value=reference_result)
    scalar_result = MagicMock()
    scalar_result.all.return_value = [assets[-1]]
    session.scalars = AsyncMock(return_value=scalar_result)
    session.flush = AsyncMock()
    delete_object = AsyncMock()
    monkeypatch.setattr("app.courses.services._best_effort_delete_object", delete_object)

    reclaimed = await reclaim_orphaned_course_media(session, COURSE_ID)

    assert reclaimed == 1
    orphan_query = session.scalars.await_args.args[0]
    compiled_query = orphan_query.compile()
    orphan_sql = str(compiled_query)
    assert "course_media_assets.course_id" in orphan_sql
    assert "course_media_assets.created_at <" in orphan_sql
    assert "course_media_assets.id NOT IN" in orphan_sql
    assert "course_media_assets.object_key NOT IN" in orphan_sql
    parameter_values = list(compiled_query.params.values())
    collection_parameters = [
        value for value in parameter_values if isinstance(value, (list, set, tuple))
    ]
    assert any(referenced_id in value for value in collection_parameters)
    assert any(thumbnail_key in value for value in collection_parameters)
    cutoff = next(value for value in parameter_values if hasattr(value, "tzinfo"))
    assert utc_now() - timedelta(minutes=11) < cutoff < utc_now() - timedelta(minutes=9)
    assert assets[0].deleted_at is None
    assert assets[1].deleted_at is None
    assert assets[2].deleted_at is None
    assert assets[3].deleted_at is not None
    session.flush.assert_awaited_once()
    delete_object.assert_awaited_once_with(assets[3].object_key)


@pytest.mark.anyio
async def test_reclaim_reference_query_covers_all_thumbnail_levels() -> None:
    session = MagicMock()
    reference_result = MagicMock()
    reference_result.all.return_value = []
    session.execute = AsyncMock(return_value=reference_result)
    scalar_result = MagicMock()
    scalar_result.all.return_value = []
    session.scalars = AsyncMock(return_value=scalar_result)

    await reclaim_orphaned_course_media(session, COURSE_ID)

    sql = str(session.execute.await_args.args[0])
    assert "courses.thumbnail_url" in sql
    assert "course_sections.image_url" in sql
    assert "lessons.image_url" in sql
    assert "course_blocks.content" in sql


@pytest.mark.anyio
async def test_publish_reclaims_orphaned_media(monkeypatch: pytest.MonkeyPatch) -> None:
    session = MagicMock()
    session.scalar = AsyncMock(return_value=1)
    session.commit = AsyncMock()
    course = Course(id=COURSE_ID, title="Course", slug="course", status="draft")
    monkeypatch.setattr("app.courses.services.require_course", AsyncMock(return_value=course))
    reclaim = AsyncMock()
    monkeypatch.setattr("app.courses.services.reclaim_orphaned_course_media", reclaim)

    response = await publish_course(session, COURSE_ID)

    assert response.status == "published"
    reclaim.assert_awaited_once_with(session, COURSE_ID)
    session.commit.assert_awaited_once()


@pytest.mark.anyio
async def test_media_delivery_url_includes_asset_metadata(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    asset_id = UUID("00000000-0000-0000-0000-000000000099")
    asset = CourseMediaAsset(
        id=asset_id,
        tenant_id=TENANT_ID,
        course_id=COURSE_ID,
        object_key=f"tenants/{TENANT_ID}/courses/{COURSE_ID}/{asset_id}/guide.pdf",
        file_name="guide.pdf",
        content_type="application/pdf",
        byte_size=4_200_000,
        checksum_sha256=None,
    )
    session = AsyncMock()
    session.scalar = AsyncMock(return_value=asset)
    monkeypatch.setattr("app.courses.services.require_course", AsyncMock())
    monkeypatch.setattr(
        "app.courses.services.StorageClient.presign_get",
        AsyncMock(return_value="http://storage/read"),
    )

    response = await media_delivery_url(session, COURSE_ID, asset_id)

    assert response.file_name == "guide.pdf"
    assert response.content_type == "application/pdf"
    assert response.byte_size == 4_200_000
