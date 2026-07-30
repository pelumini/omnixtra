from pathlib import Path

from scripts.check_isolation_coverage import missing_isolation_coverage


def test_isolation_coverage_gate_passes_without_protected_routes() -> None:
    assert missing_isolation_coverage(Path("tests")) == []
