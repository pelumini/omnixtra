from typing import Protocol


class TutorProvider(Protocol):
    name: str

    async def answer(self, *, question: str, context: list[str]) -> str: ...


class AdvisoryProvider:
    name = "advisory-local"

    async def answer(self, *, question: str, context: list[str]) -> str:
        if not context:
            return "I could not find relevant course material for that question."
        return f"Based on the course material for '{question}': {context[0]}"


class OpenAIProvider:
    name = "openai"

    async def answer(self, *, question: str, context: list[str]) -> str:
        msg = "OpenAI calls run only from asynchronous tutor jobs."
        raise NotImplementedError(msg)


class AnthropicProvider:
    name = "anthropic"

    async def answer(self, *, question: str, context: list[str]) -> str:
        msg = "Anthropic calls run only from asynchronous tutor jobs."
        raise NotImplementedError(msg)
