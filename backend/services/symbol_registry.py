from services.weeklys_symbols import WEEKLYS_SYMBOLS

USER_SYMBOLS: set[str] = set()
POSITION_SYMBOLS: set[str] = set()


def get_symbols() -> list[str]:
    combined = WEEKLYS_SYMBOLS | USER_SYMBOLS | POSITION_SYMBOLS
    return sorted(s for s in combined if s)


def add_user_symbol(symbol: str) -> None:
    clean = symbol.strip().upper()
    if clean:
        USER_SYMBOLS.add(clean)


def remove_user_symbol(symbol: str) -> None:
    USER_SYMBOLS.discard(symbol.strip().upper())


def set_position_symbols(symbols: list[str]) -> None:
    POSITION_SYMBOLS.clear()
    POSITION_SYMBOLS.update(s.strip().upper() for s in symbols if s)


def get_registry_stats() -> dict:
    return {
        "weeklys_count": len(WEEKLYS_SYMBOLS),
        "user_count": len(USER_SYMBOLS),
        "positions_count": len(POSITION_SYMBOLS),
        "active_count": len(get_symbols()),
    }