from __future__ import annotations

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from os import getenv
from urllib.parse import urlparse

import fitz
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .analyzer import analyze_job_fit, compare_resume_versions
from .models import (
    AnalysisReport,
    AnalyzeRequest,
    ApplicationCreate,
    ApplicationItem,
    ApplicationUpdate,
    ParseResumeResponse,
    ReportListItem,
    ReportsExport,
    ReportsImportResult,
    ResumeMatrixReport,
    ResumeMatrixRequest,
)
from .storage import (
    create_application,
    delete_report,
    get_report,
    import_reports,
    init_db,
    list_applications,
    list_full_reports,
    list_reports,
    save_report,
    update_application,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="JobFit RAG API", version="0.5.0", lifespan=lifespan)
MAX_RESUME_UPLOAD_BYTES = 2 * 1024 * 1024
DEFAULT_CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]


def cors_origins() -> list[str]:
    origins = list(DEFAULT_CORS_ORIGINS)
    for origin in getenv("JOBFIT_EXTRA_CORS_ORIGINS", "").split(","):
        origin = origin.strip().rstrip("/")
        parsed = urlparse(origin)
        if parsed.scheme in {"http", "https"} and parsed.hostname in {"localhost", "127.0.0.1"}:
            origins.append(origin)
    return origins


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_, exc: RequestValidationError) -> JSONResponse:
    errors = []
    for error in exc.errors():
        safe_error = {key: value for key, value in error.items() if key not in {"input", "ctx"}}
        errors.append(safe_error)
    return JSONResponse(status_code=422, content={"detail": errors})


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "jobfit-rag"}


@app.post("/api/analyze", response_model=AnalysisReport)
def analyze(request: AnalyzeRequest) -> AnalysisReport:
    report = analyze_job_fit(request.resume_text, request.jd_text)
    save_report(report)
    return report


@app.post("/api/resume-matrix", response_model=ResumeMatrixReport)
def resume_matrix(request: ResumeMatrixRequest) -> ResumeMatrixReport:
    return compare_resume_versions(request.versions, request.jd_text)


@app.post("/api/parse-resume", response_model=ParseResumeResponse)
async def parse_resume(file: UploadFile = File(...)) -> ParseResumeResponse:
    payload = await file.read(MAX_RESUME_UPLOAD_BYTES + 1)
    if len(payload) > MAX_RESUME_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Resume file is too large. Maximum size is 2 MB.")

    filename = file.filename or "resume"
    suffix = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if suffix == "pdf":
        text = _extract_pdf_text(payload)
    elif suffix in {"txt", "md", "markdown", "text"}:
        text = payload.decode("utf-8", errors="ignore")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF, TXT, or Markdown.")
    cleaned = text.strip()
    if len(cleaned) < 20:
        raise HTTPException(status_code=400, detail="Could not extract enough resume text.")
    return ParseResumeResponse(filename=filename, text=cleaned)


@app.get("/api/reports", response_model=list[ReportListItem])
def reports() -> list[ReportListItem]:
    return list_reports()


@app.get("/api/reports/{report_id}", response_model=AnalysisReport)
def report_detail(report_id: str) -> AnalysisReport:
    report = get_report(report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@app.get("/api/reports-export", response_model=ReportsExport)
def export_reports() -> ReportsExport:
    return ReportsExport(exported_at=datetime.now(timezone.utc), reports=list_full_reports())


@app.post("/api/reports-import", response_model=ReportsImportResult)
def import_report_bundle(bundle: ReportsExport) -> ReportsImportResult:
    if bundle.version != "jobfit-rag-export-v1":
        raise HTTPException(status_code=400, detail="Unsupported export version")
    stats = import_reports(bundle.reports)
    return ReportsImportResult(imported=stats.imported, skipped=stats.skipped)


@app.delete("/api/reports/{report_id}")
def remove_report(report_id: str) -> dict[str, bool]:
    deleted = delete_report(report_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"deleted": True}


@app.get("/api/applications", response_model=list[ApplicationItem])
def applications() -> list[ApplicationItem]:
    return list_applications()


@app.post("/api/applications", response_model=ApplicationItem)
def add_application(payload: ApplicationCreate) -> ApplicationItem:
    return create_application(payload)


@app.patch("/api/applications/{application_id}", response_model=ApplicationItem)
def patch_application(application_id: str, payload: ApplicationUpdate) -> ApplicationItem:
    application = update_application(application_id, payload)
    if application is None:
        raise HTTPException(status_code=404, detail="Application not found")
    return application


def _extract_pdf_text(payload: bytes) -> str:
    try:
        with fitz.open(stream=payload, filetype="pdf") as document:
            return "\n".join(page.get_text("text") for page in document)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not parse PDF resume.") from exc
