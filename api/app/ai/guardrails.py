QUIZ_ANSWER_PATTERNS = ("correct answer", "answer key", "give me the answer")
PROMPT_INJECTION_PATTERNS = (
    "ignore previous instructions",
    "developer message",
    "system prompt",
    "reveal hidden",
)


def should_refuse_question(question: str) -> str | None:
    normalized = question.casefold()
    if any(pattern in normalized for pattern in QUIZ_ANSWER_PATTERNS):
        return "I cannot provide quiz answers verbatim. I can explain the relevant lesson concept."
    if any(pattern in normalized for pattern in PROMPT_INJECTION_PATTERNS):
        return "I can only answer using the course material available to this tenant and course."
    return None
