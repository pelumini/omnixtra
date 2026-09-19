from __future__ import annotations

import os
import subprocess
import sys
import time

COMMANDS: tuple[tuple[str, ...], ...] = (
    ("ruff", "check", "."),
    ("ruff", "format", "--check", "."),
    ("mypy", "app", "--strict"),
    ("pytest", "-p", "no:cacheprovider", "--basetemp", ".tmp/pytest", "-m", "not integration"),
)


def main() -> int:
    started_at = time.monotonic()
    for command in COMMANDS:
        exit_code = run(command)
        if exit_code != 0:
            return exit_code

    if os.getenv("OMNIXTRA_TEST_DATABASE_URL"):
        exit_code = run(
            (
                "pytest",
                "-p",
                "no:cacheprovider",
                "--basetemp",
                ".tmp/pytest",
                "tests/integration",
                "-m",
                "integration",
            ),
        )
        if exit_code != 0:
            return exit_code
    else:
        sys.stdout.write("Skipping integration tests: OMNIXTRA_TEST_DATABASE_URL is not set.\n")

    elapsed = time.monotonic() - started_at
    sys.stdout.write(f"Backend verify completed in {elapsed:.1f}s.\n")
    return 0


def run(command: tuple[str, ...]) -> int:
    sys.stdout.write(f"$ {' '.join(command)}\n")
    return subprocess.run(command, check=False).returncode  # noqa: S603


if __name__ == "__main__":
    raise SystemExit(main())
