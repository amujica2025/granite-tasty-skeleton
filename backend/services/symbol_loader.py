from __future__ import annotations

from pathlib import Path
import importlib.util


def load_weeklys_symbols() -> list[str]:
    repo_root = Path(__file__).resolve().parents[2]
    file_path = repo_root / "backend" / "data" / "weeklys_symbols.py"

    if not file_path.exists():
        print("⚠️ weeklys_symbols.py not found")
        return []

    spec = importlib.util.spec_from_file_location("weeklys_module", file_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    symbols = getattr(module, "WEEKLYS_SYMBOLS", [])

    print(f"📦 Loaded WEEKLYS from PY file: {len(symbols)} symbols")
    return symbols