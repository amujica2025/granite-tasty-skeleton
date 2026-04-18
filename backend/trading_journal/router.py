from __future__ import annotations

from pathlib import Path
from fastapi import APIRouter

router = APIRouter(prefix="/journal", tags=["journal"])

BASE_DIR = Path(__file__).resolve().parent
SCHEMA_PATH = BASE_DIR / "schema_v1.sql"

@router.get("/schema")
def get_schema() -> dict:
    return {
        "ok": True,
        "path": str(SCHEMA_PATH),
        "schema_preview": SCHEMA_PATH.read_text(encoding="utf-8")[:4000] if SCHEMA_PATH.exists() else "",
    }

@router.get("/alerts")
def get_alerts() -> dict:
    return {
        "ok": True,
        "alerts": [
            {"id": "ALT-1001", "symbol": "IBM", "field": "last_price", "operator": "<", "value": "230"},
            {"id": "ALT-1002", "symbol": "TSLA", "field": "upper_bb_pct", "operator": ">", "value": "105"},
        ],
    }

@router.post("/query")
def query_journal(payload: dict) -> dict:
    prompt = payload.get("prompt", "")
    return {
        "ok": True,
        "mode": "mock",
        "prompt": prompt,
        "answer": "Query routing should go SQL first, then event replay, then RAG enrichment.",
    }
