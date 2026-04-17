"""
LegalEase AI – Report Storage Service
Stores and retrieves analysis reports using SQLite.
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import Optional

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
_configured_db_path = os.getenv("DB_PATH", "legalease.db")
DB_PATH = _configured_db_path if os.path.isabs(_configured_db_path) else os.path.join(BASE_DIR, _configured_db_path)


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_column(conn, table: str, column: str, definition: str):
    columns = {row["name"] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}
    if column not in columns:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


def init_db():
    """Create tables if they don't exist."""
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id          TEXT PRIMARY KEY,
                created_at  TEXT NOT NULL,
                idea        TEXT NOT NULL,
                location    TEXT NOT NULL,
                scale       TEXT NOT NULL,
                mode        TEXT NOT NULL,
                data        TEXT NOT NULL,
                pdf_path    TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS report_tasks (
                report_id    TEXT NOT NULL,
                task_key     TEXT NOT NULL,
                title        TEXT NOT NULL,
                category     TEXT NOT NULL,
                timeframe    TEXT,
                status       TEXT NOT NULL DEFAULT 'pending',
                source       TEXT NOT NULL DEFAULT 'workspace',
                created_at   TEXT NOT NULL,
                updated_at   TEXT NOT NULL,
                PRIMARY KEY (report_id, task_key)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS report_documents (
                report_id      TEXT NOT NULL,
                doc_key        TEXT NOT NULL,
                license_name   TEXT NOT NULL,
                document_name  TEXT NOT NULL,
                status         TEXT NOT NULL DEFAULT 'missing',
                note           TEXT,
                original_filename TEXT,
                stored_filename TEXT,
                stored_path    TEXT,
                content_type   TEXT,
                file_size      INTEGER,
                validation_status TEXT,
                validation_note TEXT,
                uploaded_at    TEXT,
                created_at     TEXT NOT NULL,
                updated_at     TEXT NOT NULL,
                PRIMARY KEY (report_id, doc_key)
            )
        """)
        _ensure_column(conn, "report_documents", "original_filename", "TEXT")
        _ensure_column(conn, "report_documents", "stored_filename", "TEXT")
        _ensure_column(conn, "report_documents", "stored_path", "TEXT")
        _ensure_column(conn, "report_documents", "content_type", "TEXT")
        _ensure_column(conn, "report_documents", "file_size", "INTEGER")
        _ensure_column(conn, "report_documents", "validation_status", "TEXT")
        _ensure_column(conn, "report_documents", "validation_note", "TEXT")
        _ensure_column(conn, "report_documents", "validation_payload", "TEXT")
        _ensure_column(conn, "report_documents", "uploaded_at", "TEXT")
        conn.commit()


def save_report(report_id: str, idea: str, location: str, scale: str, mode: str, data: dict, pdf_path: str = None):
    init_db()
    with get_conn() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO reports
               (id, created_at, idea, location, scale, mode, data, pdf_path)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (report_id, datetime.utcnow().isoformat(), idea, location, scale, mode,
             json.dumps(data), pdf_path)
        )
        conn.commit()


def get_report(report_id: str) -> Optional[dict]:
    init_db()
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
    if not row:
        return None
    result = dict(row)
    result["data"] = json.loads(result["data"])
    return result


def list_reports(limit: int = 20) -> list:
    init_db()
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, created_at, idea, location, scale FROM reports ORDER BY created_at DESC LIMIT ?",
            (limit,)
        ).fetchall()
    return [dict(r) for r in rows]


def upsert_report_task(
    report_id: str,
    task_key: str,
    title: str,
    category: str,
    timeframe: Optional[str],
    status: str = "pending",
    source: str = "workspace",
):
    init_db()
    now = datetime.utcnow().isoformat()
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO report_tasks (report_id, task_key, title, category, timeframe, status, source, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(report_id, task_key) DO UPDATE SET
                title = excluded.title,
                category = excluded.category,
                timeframe = excluded.timeframe,
                updated_at = excluded.updated_at
            """,
            (report_id, task_key, title, category, timeframe, status, source, now, now),
        )
        conn.commit()


def set_report_task_status(report_id: str, task_key: str, status: str) -> bool:
    init_db()
    now = datetime.utcnow().isoformat()
    with get_conn() as conn:
        result = conn.execute(
            "UPDATE report_tasks SET status = ?, updated_at = ? WHERE report_id = ? AND task_key = ?",
            (status, now, report_id, task_key),
        )
        conn.commit()
    return result.rowcount > 0


def list_report_tasks(report_id: str) -> list[dict]:
    init_db()
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT report_id, task_key, title, category, timeframe, status, source, created_at, updated_at
            FROM report_tasks
            WHERE report_id = ?
            ORDER BY
                CASE status
                    WHEN 'in_progress' THEN 0
                    WHEN 'pending' THEN 1
                    ELSE 2
                END,
                created_at ASC
            """,
            (report_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def upsert_report_document(
    report_id: str,
    doc_key: str,
    license_name: str,
    document_name: str,
    status: str = "missing",
    note: Optional[str] = None,
    original_filename: Optional[str] = None,
    stored_filename: Optional[str] = None,
    stored_path: Optional[str] = None,
    content_type: Optional[str] = None,
    file_size: Optional[int] = None,
    validation_status: Optional[str] = None,
    validation_note: Optional[str] = None,
    validation_payload: Optional[str] = None,
    uploaded_at: Optional[str] = None,
):
    init_db()
    now = datetime.utcnow().isoformat()
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO report_documents (
                report_id, doc_key, license_name, document_name, status, note,
                original_filename, stored_filename, stored_path, content_type, file_size,
                validation_status, validation_note, validation_payload, uploaded_at, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(report_id, doc_key) DO UPDATE SET
                license_name = excluded.license_name,
                document_name = excluded.document_name,
                status = excluded.status,
                note = excluded.note,
                original_filename = COALESCE(excluded.original_filename, report_documents.original_filename),
                stored_filename = COALESCE(excluded.stored_filename, report_documents.stored_filename),
                stored_path = COALESCE(excluded.stored_path, report_documents.stored_path),
                content_type = COALESCE(excluded.content_type, report_documents.content_type),
                file_size = COALESCE(excluded.file_size, report_documents.file_size),
                validation_status = COALESCE(excluded.validation_status, report_documents.validation_status),
                validation_note = COALESCE(excluded.validation_note, report_documents.validation_note),
                validation_payload = COALESCE(excluded.validation_payload, report_documents.validation_payload),
                uploaded_at = COALESCE(excluded.uploaded_at, report_documents.uploaded_at),
                updated_at = excluded.updated_at
            """,
            (
                report_id, doc_key, license_name, document_name, status, note,
                original_filename, stored_filename, stored_path, content_type, file_size,
                validation_status, validation_note, validation_payload, uploaded_at, now, now,
            ),
        )
        conn.commit()


def list_report_documents(report_id: str) -> list[dict]:
    init_db()
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT
                report_id, doc_key, license_name, document_name, status, note,
                original_filename, stored_filename, stored_path, content_type, file_size,
                validation_status, validation_note, validation_payload, uploaded_at, created_at, updated_at
            FROM report_documents
            WHERE report_id = ?
            ORDER BY license_name ASC, document_name ASC
            """,
            (report_id,),
        ).fetchall()
    return [dict(row) for row in rows]


def get_dashboard_summary() -> dict:
    init_db()
    with get_conn() as conn:
        report_count = conn.execute("SELECT COUNT(*) AS count FROM reports").fetchone()["count"]
        task_row = conn.execute(
            """
            SELECT
                COUNT(*) AS total_tasks,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks
            FROM report_tasks
            """
        ).fetchone()
        document_row = conn.execute(
            """
            SELECT
                COUNT(*) AS total_documents,
                SUM(CASE WHEN status IN ('ready', 'submitted') THEN 1 ELSE 0 END) AS ready_documents
            FROM report_documents
            """
        ).fetchone()
        state_rows = conn.execute(
            """
            SELECT location, COUNT(*) AS report_count
            FROM reports
            GROUP BY location
            ORDER BY report_count DESC, location ASC
            LIMIT 5
            """
        ).fetchall()

    total_tasks = task_row["total_tasks"] or 0
    completed_tasks = task_row["completed_tasks"] or 0
    total_documents = document_row["total_documents"] or 0
    ready_documents = document_row["ready_documents"] or 0

    return {
        "report_count": report_count,
        "task_count": total_tasks,
        "completed_task_count": completed_tasks,
        "completion_rate": round((completed_tasks / total_tasks) * 100) if total_tasks else 0,
        "document_count": total_documents,
        "ready_document_count": ready_documents,
        "top_states": [dict(row) for row in state_rows],
    }
