from __future__ import annotations

import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

from .models import (
    AnalysisReport,
    ApplicationCreate,
    ApplicationItem,
    ApplicationUpdate,
    ReportImportStats,
    ReportListItem,
)


DB_PATH = Path(os.getenv("JOBFIT_DB_PATH", "/app/data/jobfit.sqlite3"))


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                overall_score INTEGER NOT NULL,
                summary TEXT NOT NULL,
                payload TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS applications (
                id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                company TEXT NOT NULL,
                role TEXT NOT NULL,
                status TEXT NOT NULL,
                next_action TEXT NOT NULL,
                report_id TEXT
            )
            """
        )


def save_report(report: AnalysisReport) -> None:
    init_db()
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO reports (id, created_at, overall_score, summary, payload)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                report.id,
                report.created_at.isoformat(),
                report.overall_score,
                report.summary,
                report.model_dump_json(),
            ),
        )


def list_reports() -> list[ReportListItem]:
    init_db()
    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute(
            """
            SELECT id, created_at, overall_score, summary
            FROM reports
            ORDER BY created_at DESC
            LIMIT 50
            """
        ).fetchall()
    return [
        ReportListItem(id=row[0], created_at=datetime.fromisoformat(row[1]), overall_score=row[2], summary=row[3])
        for row in rows
    ]


def list_full_reports() -> list[AnalysisReport]:
    init_db()
    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute(
            """
            SELECT payload
            FROM reports
            ORDER BY created_at DESC
            LIMIT 200
            """
        ).fetchall()
    reports: list[AnalysisReport] = []
    for row in rows:
        try:
            reports.append(AnalysisReport.model_validate(json.loads(row[0])))
        except Exception:
            continue
    return reports


def get_report(report_id: str) -> AnalysisReport | None:
    init_db()
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute("SELECT payload FROM reports WHERE id = ?", (report_id,)).fetchone()
    if not row:
        return None
    return AnalysisReport.model_validate(json.loads(row[0]))


def delete_report(report_id: str) -> bool:
    init_db()
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute("DELETE FROM reports WHERE id = ?", (report_id,))
        return cursor.rowcount > 0


def import_reports(reports: list[AnalysisReport]) -> ReportImportStats:
    init_db()
    imported = 0
    skipped = 0
    with sqlite3.connect(DB_PATH) as conn:
        for report in reports:
            existing = conn.execute("SELECT 1 FROM reports WHERE id = ?", (report.id,)).fetchone()
            if existing:
                skipped += 1
                continue
            conn.execute(
                """
                INSERT INTO reports (id, created_at, overall_score, summary, payload)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    report.id,
                    report.created_at.isoformat(),
                    report.overall_score,
                    report.summary,
                    report.model_dump_json(),
                ),
            )
            imported += 1
    return ReportImportStats(imported=imported, skipped=skipped)


def create_application(payload: ApplicationCreate) -> ApplicationItem:
    init_db()
    now = datetime.now(timezone.utc).isoformat()
    item_id = str(uuid.uuid4())
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO applications (id, created_at, updated_at, company, role, status, next_action, report_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                item_id,
                now,
                now,
                payload.company,
                payload.role,
                payload.status,
                payload.next_action,
                payload.report_id,
            ),
        )
    return ApplicationItem(
        id=item_id,
        created_at=datetime.fromisoformat(now),
        updated_at=datetime.fromisoformat(now),
        company=payload.company,
        role=payload.role,
        status=payload.status,
        next_action=payload.next_action,
        report_id=payload.report_id,
    )


def list_applications() -> list[ApplicationItem]:
    init_db()
    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute(
            """
            SELECT id, created_at, updated_at, company, role, status, next_action, report_id
            FROM applications
            ORDER BY updated_at DESC
            LIMIT 100
            """
        ).fetchall()
    return [_application_from_row(row) for row in rows]


def update_application(application_id: str, payload: ApplicationUpdate) -> ApplicationItem | None:
    init_db()
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            """
            SELECT id, created_at, updated_at, company, role, status, next_action, report_id
            FROM applications
            WHERE id = ?
            """,
            (application_id,),
        ).fetchone()
        if not row:
            return None
        current = _application_from_row(row)
        updated_at = datetime.now(timezone.utc).isoformat()
        next_status = payload.status or current.status
        next_action = payload.next_action if payload.next_action is not None else current.next_action
        next_report_id = payload.report_id if payload.report_id is not None else current.report_id
        conn.execute(
            """
            UPDATE applications
            SET updated_at = ?, status = ?, next_action = ?, report_id = ?
            WHERE id = ?
            """,
            (updated_at, next_status, next_action, next_report_id, application_id),
        )
    return ApplicationItem(
        id=current.id,
        created_at=current.created_at,
        updated_at=datetime.fromisoformat(updated_at),
        company=current.company,
        role=current.role,
        status=next_status,
        next_action=next_action,
        report_id=next_report_id,
    )


def _application_from_row(row: tuple) -> ApplicationItem:
    return ApplicationItem(
        id=row[0],
        created_at=datetime.fromisoformat(row[1]),
        updated_at=datetime.fromisoformat(row[2]),
        company=row[3],
        role=row[4],
        status=row[5],
        next_action=row[6],
        report_id=row[7],
    )
