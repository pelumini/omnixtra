from hashlib import sha256
from uuid import UUID


def semantic_hash(question: str) -> str:
    normalized = " ".join(question.casefold().split())
    return sha256(normalized.encode("utf-8")).hexdigest()


def semantic_cache_key(*, tenant_id: UUID, course_id: UUID, semantic_hash_value: str) -> str:
    return f"tenant:{tenant_id}:ai_cache:course:{course_id}:semantic:{semantic_hash_value}"
