# AI Provider Runbook

## Runtime Selection

Tutor jobs select providers at worker runtime using `AI_PROVIDER`.

| `AI_PROVIDER` | Tutor provider | Embedding provider |
|---|---|---|
| `auto` | OpenAI when `OPENAI_API_KEY` exists, else Anthropic when `ANTHROPIC_API_KEY` exists, else advisory local | OpenAI when `OPENAI_API_KEY` exists, else local deterministic |
| `openai` | OpenAI | OpenAI |
| `anthropic` | Anthropic | Local deterministic |
| `advisory-local` | Advisory local | Local deterministic |

`advisory-local` is a non-LLM fallback. Its responses are explicitly advisory and are useful for local development or degraded production mode.

## Required Settings

```env
AI_PROVIDER=auto
AI_PROVIDER_TIMEOUT_SECONDS=30
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-3-5-haiku-latest
```

## Verification

Run the backend AI tests:

```bash
cd api
uv run pytest tests/test_ai_graph.py tests/test_ai_providers.py tests/test_ai_provider_selection.py tests/test_ai_actors.py tests/test_ai_retrieval.py
```

Run the Sprint 4 tutor eval only with a real provider key when recording exit evidence:

```bash
cd api
$env:AI_PROVIDER="openai"
$env:OPENAI_API_KEY="<real key>"
uv run python -m app.ai.evals --require-real-provider --delay-seconds 2 --output ../docs/runbooks/ai-tutor-eval-latest.json
```

For Anthropic tutor evaluation, set `AI_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`. Anthropic mode still uses the local deterministic embedding fallback because no Anthropic embedding provider is wired.

The eval summary records `provider`, `advisory`, `passed`, `failed`, `total`, `pass_rate`, `generated_at`, and provider `errors`. A run with `advisory=true` is valid for local smoke testing but does not satisfy the Sprint 4 real-provider exit criterion. A run with `errors` is recorded as failed evidence and must not close Sprint 4.

`docs/runbooks/ai-tutor-eval-latest.json` records the latest local real-provider evidence. It proves the named provider/key succeeded for that run, but it is not reproducible from a fresh clone unless the same command is rerun with a valid provider key:

```bash
cd api
uv run python -m app.ai.evals --require-real-provider --delay-seconds 2 --output ../docs/runbooks/ai-tutor-eval-latest.json
```

Run migrations to add embedding provenance:

```bash
cd api
uv run alembic upgrade head
```

## Re-Embedding

Embedding rows include `embedding_provider`. Retrieval filters by both tenant/course and provider so query embeddings are compared only with matching lesson vectors.

If `AI_PROVIDER` changes the active embedding provider for a tenant or course, enqueue fresh embeddings through the maintenance actor:

```python
from app.ai.actors import reenqueue_course_embedding_jobs

reenqueue_course_embedding_jobs.send(
    tenant_id=str(tenant_id),
    course_id=str(course_id),
    lessons=[
        {
            "lesson_id": str(lesson_id),
            "lesson_version": lesson_version,
            "text": lesson_text,
        },
    ],
)
```

Keep the lesson payload tenant-scoped and source it from the course service boundary.
