from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any, cast

import aioboto3  # type: ignore[import-untyped]
from botocore.config import Config  # type: ignore[import-untyped]

from app.core.config import get_settings


class StorageClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.session = aioboto3.Session()

    @asynccontextmanager
    async def client(self, endpoint_url: str | None = None) -> AsyncIterator[Any]:
        async with self.session.client(
            "s3",
            endpoint_url=endpoint_url or self.settings.storage_endpoint_url,
            region_name=self.settings.storage_region,
            aws_access_key_id=self.settings.storage_access_key_id,
            aws_secret_access_key=self.settings.storage_secret_access_key,
            config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
        ) as client:
            yield client

    async def presign_put(self, object_key: str, content_type: str) -> str:
        browser_endpoint = (
            self.settings.storage_browser_endpoint_url or self.settings.storage_endpoint_url
        )
        async with self.client(browser_endpoint) as client:
            return cast(
                "str",
                await client.generate_presigned_url(
                    "put_object",
                    Params={
                        "Bucket": self.settings.storage_bucket,
                        "Key": object_key,
                        "ContentType": content_type,
                    },
                    ExpiresIn=self.settings.storage_presign_seconds,
                ),
            )

    async def presign_get(self, object_key: str) -> str:
        if self.settings.storage_public_base_url:
            return f"{self.settings.storage_public_base_url.rstrip('/')}/{object_key}"
        browser_endpoint = (
            self.settings.storage_browser_endpoint_url or self.settings.storage_endpoint_url
        )
        async with self.client(browser_endpoint) as client:
            return cast(
                "str",
                await client.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": self.settings.storage_bucket, "Key": object_key},
                    ExpiresIn=self.settings.storage_download_seconds,
                ),
            )

    async def head(self, object_key: str) -> dict[str, Any]:
        async with self.client() as client:
            return dict(
                await client.head_object(Bucket=self.settings.storage_bucket, Key=object_key)
            )

    async def delete(self, object_key: str) -> None:
        async with self.client() as client:
            await client.delete_object(Bucket=self.settings.storage_bucket, Key=object_key)
