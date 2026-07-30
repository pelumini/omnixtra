from app.ai import actors
from app.workers.broker import broker

__all__ = ["actors", "broker"]


def main() -> None:
    """Import broker and actors for `dramatiq app.workers.main`."""


if __name__ == "__main__":
    main()
