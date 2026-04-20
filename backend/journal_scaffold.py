"""
Additive journal scaffold only.

This file is safe to add without startup wiring.
It defines contract-shaped in-memory structures for later use.
It does not require env vars, blocking calls, or runtime initialization elsewhere.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal


SourceAgent = Literal["positions", "scanner", "alerts", "artifact", "journal"]
JournalEntryType = Literal["note", "summary", "reflection", "linked_context"]
JournalEntrySource = Literal["user", "journal", "system"]
QueryMode = Literal["direct", "expanded"]
ConfidenceMode = Literal["stored_context", "mixed_context"]


@dataclass(slots=True)
class JournalEvent:
    event_id: str
    event_type: str
    event_ts: str
    source_agent: SourceAgent
    underlying: str
    payload: Dict[str, Any]
    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class JournalEntry:
    journal_entry_id: str
    entry_type: JournalEntryType
    created_ts: str
    title: str
    body: str
    source: JournalEntrySource
    linked_objects: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class QueryRequest:
    query_id: str
    query_ts: str
    user_text: str
    context_filters: Dict[str, Any]
    mode: QueryMode

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class QueryResponse:
    response_id: str
    query_id: str
    answer: str
    sources: List[str]
    confidence_mode: ConfidenceMode
    next_actions: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class JournalScaffoldStore:
    """
    In-memory scaffold only.
    No file I/O, DB calls, startup hooks, or external imports.
    """

    def __init__(self) -> None:
        self._events: List[JournalEvent] = []
        self._entries: List[JournalEntry] = []

    @staticmethod
    def utc_now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()

    def add_event(self, event: JournalEvent) -> None:
        self._events.append(event)

    def add_entry(self, entry: JournalEntry) -> None:
        self._entries.append(entry)

    def list_events(self) -> List[JournalEvent]:
        return list(self._events)

    def list_entries(self) -> List[JournalEntry]:
        return list(self._entries)

    def query_events(self, text: str) -> List[JournalEvent]:
        needle = text.lower().strip()
        if not needle:
            return []
        matches: List[JournalEvent] = []
        for event in self._events:
          haystack = " ".join(
              [
                  event.event_id,
                  event.event_type,
                  event.event_ts,
                  event.source_agent,
                  event.underlying,
                  " ".join(event.tags),
                  str(event.payload),
              ]
          ).lower()
          if needle in haystack:
              matches.append(event)
        return matches

    def query_entries(self, text: str) -> List[JournalEntry]:
        needle = text.lower().strip()
        if not needle:
            return []
        matches: List[JournalEntry] = []
        for entry in self._entries:
            haystack = " ".join(
                [
                    entry.journal_entry_id,
                    entry.entry_type,
                    entry.created_ts,
                    entry.title,
                    entry.body,
                    entry.source,
                    " ".join(entry.linked_objects),
                ]
            ).lower()
            if needle in haystack:
                matches.append(entry)
        return matches

    def answer_query(self, request: QueryRequest) -> QueryResponse:
        event_matches = self.query_events(request.user_text)
        entry_matches = self.query_entries(request.user_text)

        if request.mode == "direct":
            if event_matches:
                top = event_matches[0]
                answer = (
                    f"{len(event_matches)} matching event(s). "
                    f"Most recent match: {top.event_type} from {top.source_agent} at {top.event_ts}."
                )
                return QueryResponse(
                    response_id=f"resp-{request.query_id}",
                    query_id=request.query_id,
                    answer=answer,
                    sources=[event.event_id for event in event_matches],
                    confidence_mode="stored_context",
                    next_actions=["Review the Events view for payload detail."],
                )

            if entry_matches:
                top = entry_matches[0]
                answer = (
                    f'{len(entry_matches)} matching journal entr{"y" if len(entry_matches) == 1 else "ies"}. '
                    f'Most relevant: "{top.title}".'
                )
                return QueryResponse(
                    response_id=f"resp-{request.query_id}",
                    query_id=request.query_id,
                    answer=answer,
                    sources=[entry.journal_entry_id for entry in entry_matches],
                    confidence_mode="stored_context",
                    next_actions=["Review the Journal view for readable context."],
                )

            return QueryResponse(
                response_id=f"resp-{request.query_id}",
                query_id=request.query_id,
                answer="No matching stored context found.",
                sources=[],
                confidence_mode="stored_context",
                next_actions=["Try a symbol, event type, or source agent term."],
            )

        detail_lines: List[str] = []
        if event_matches:
            detail_lines.append(f"Events ({len(event_matches)})")
            detail_lines.extend(
                [
                    f"- {event.event_type} | {event.event_ts} | {event.source_agent} | {event.underlying}"
                    for event in event_matches
                ]
            )
        if entry_matches:
            detail_lines.append(f"Journal entries ({len(entry_matches)})")
            detail_lines.extend(
                [
                    f"- {entry.title} | {entry.created_ts} | {entry.entry_type}"
                    for entry in entry_matches
                ]
            )

        if not detail_lines:
            detail_lines.append("No matching stored context found.")

        return QueryResponse(
            response_id=f"resp-{request.query_id}",
            query_id=request.query_id,
            answer="\n".join(detail_lines),
            sources=[event.event_id for event in event_matches]
            + [entry.journal_entry_id for entry in entry_matches],
            confidence_mode="stored_context",
            next_actions=["Narrow the query or inspect Journal / Events directly."],
        )


def build_mock_store() -> JournalScaffoldStore:
    """
    Optional helper for future safe local testing.
    Not auto-run anywhere.
    """
    store = JournalScaffoldStore()

    store.add_event(
        JournalEvent(
            event_id="evt-20260419-001",
            event_type="positions.selection.changed",
            event_ts="2026-04-19T09:11:00Z",
            source_agent="positions",
            underlying="SPY",
            payload={
                "selected_position_ids": ["1", "3"],
                "selected_symbols": ["SPY 240620C550", "QQQ 240628C460"],
                "selection_count": 2,
            },
            tags=["selection", "positions", "working-set"],
        )
    )

    store.add_entry(
        JournalEntry(
            journal_entry_id="je-20260419-001",
            entry_type="summary",
            created_ts="2026-04-19T10:03:00Z",
            title="SPY adjustment context saved",
            body="Readable memory object linked to stored event context.",
            source="journal",
            linked_objects=["evt-20260419-001"],
        )
    )

    return store