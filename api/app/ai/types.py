from sqlalchemy.types import UserDefinedType


class Vector(UserDefinedType[object]):
    cache_ok = True

    def get_col_spec(self, **_kw: object) -> str:
        return "vector(1536)"


__all__ = ["Vector"]
