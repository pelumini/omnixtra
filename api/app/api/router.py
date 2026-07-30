from fastapi import APIRouter

from app.shared.responses import Envelope, Meta

api_router = APIRouter()


@api_router.get("/health", tags=["system"])
async def api_health() -> Envelope[dict[str, str]]:
    return Envelope(data={"status": "ok"}, error=None, meta=Meta.current())
