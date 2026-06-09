from fastapi.testclient import TestClient

from app.main import MAX_RESUME_UPLOAD_BYTES, app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_analyze_endpoint_returns_report():
    response = client.post(
        "/api/analyze",
        json={
            "resume_text": "I built React TypeScript dashboards and Dockerized FastAPI services for AI workflows.",
            "jd_text": "Role requires React, TypeScript, Docker, RAG, Embedding, FastAPI, and SQL.",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["overall_score"] > 0
    assert "React" in payload["matched_skills"]
    assert "RAG" in payload["missing_skills"]
    assert "score_breakdown" in payload
    assert "structure" in payload
    assert "learning_plan" in payload
    assert "bullet_scores" in payload
    assert "evidence_trace" in payload
    assert "tailored_resume" in payload
    assert "case_study" in payload


def test_resume_matrix_compares_versions_for_same_jd():
    response = client.post(
        "/api/resume-matrix",
        json={
            "jd_text": "Role requires React, TypeScript, FastAPI, Docker, SQL, Testing, and RAG.",
            "versions": [
                {
                    "label": "baseline",
                    "resume_text": "Jane jane@example.com Summary Frontend developer. Skills React TypeScript. Projects Built dashboards.",
                },
                {
                    "label": "tailored",
                    "resume_text": "Jane jane@example.com Summary AI application developer. Skills React TypeScript FastAPI Docker SQL Testing RAG. Projects Built a Dockerized React FastAPI RAG analyzer with SQL persistence and pytest coverage.",
                },
            ],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["best_version"] == "tailored"
    assert payload["score_delta"] > 0
    assert len(payload["versions"]) == 2
    assert payload["versions"][0]["label"] == "baseline"
    assert payload["versions"][1]["label"] == "tailored"
    assert payload["versions"][1]["overall_score"] > payload["versions"][0]["overall_score"]
    assert "FastAPI" in payload["versions"][1]["matched_skills"]
    assert payload["recommendations"]


def test_delete_report_endpoint_removes_report():
    created = client.post(
        "/api/analyze",
        json={
            "resume_text": "React TypeScript Docker FastAPI portfolio project with measurable impact.",
            "jd_text": "Role requires React, TypeScript, Docker, FastAPI, RAG, and SQL.",
        },
    ).json()

    response = client.delete(f"/api/reports/{created['id']}")

    assert response.status_code == 200
    assert response.json()["deleted"] is True
    assert client.get(f"/api/reports/{created['id']}").status_code == 404


def test_parse_resume_accepts_text_file():
    response = client.post(
        "/api/parse-resume",
        files={"file": ("resume.txt", b"Jane Doe\nReact TypeScript Docker FastAPI resume content.", "text/plain")},
    )

    assert response.status_code == 200
    assert response.json()["filename"] == "resume.txt"
    assert "React" in response.json()["text"]


def test_parse_resume_rejects_oversized_file():
    response = client.post(
        "/api/parse-resume",
        files={"file": ("resume.txt", b"a" * (MAX_RESUME_UPLOAD_BYTES + 1), "text/plain")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Resume file is too large. Maximum size is 2 MB."


def test_analyze_rejects_missing_required_text():
    response = client.post("/api/analyze", json={"resume_text": "React TypeScript Docker"})

    assert response.status_code == 422
    assert response.json()["detail"]


def assert_safe_validation_error(response, private_marker: str):
    assert response.status_code == 422
    assert private_marker not in response.text
    for error in response.json()["detail"]:
        assert "input" not in error
        assert "ctx" not in error


def test_analyze_validation_errors_do_not_echo_private_input_or_context():
    private_marker = "PRIVATE_RESUME_TEXT_SHOULD_NOT_ECHO"
    response = client.post("/api/analyze", json={"resume_text": private_marker})

    assert_safe_validation_error(response, private_marker)


def test_nested_validation_errors_do_not_echo_private_input_or_context():
    private_marker = "PRIV_MATRIX"
    response = client.post(
        "/api/resume-matrix",
        json={
            "jd_text": "Role requires React TypeScript FastAPI Docker SQL testing and RAG.",
            "versions": [
                {"label": "baseline", "resume_text": private_marker},
                {"label": "tailored", "resume_text": "React TypeScript FastAPI Docker SQL testing RAG."},
            ],
        },
    )

    assert_safe_validation_error(response, private_marker)


def test_parse_resume_rejects_unsupported_file_type():
    response = client.post(
        "/api/parse-resume",
        files={"file": ("resume.exe", b"not a resume", "application/octet-stream")},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported file type. Use PDF, TXT, or Markdown."


def test_export_and_import_reports_roundtrip():
    created = client.post(
        "/api/analyze",
        json={
            "resume_text": "Jane jane@example.com Summary React TypeScript Docker FastAPI built portfolio product.",
            "jd_text": "Role requires React, TypeScript, Docker, FastAPI, SQL, and Testing.",
        },
    ).json()

    exported = client.get("/api/reports-export")

    assert exported.status_code == 200
    payload = exported.json()
    assert payload["version"] == "jobfit-rag-export-v1"
    assert any(report["id"] == created["id"] for report in payload["reports"])

    client.delete(f"/api/reports/{created['id']}")
    assert client.get(f"/api/reports/{created['id']}").status_code == 404

    imported = client.post("/api/reports-import", json=payload)

    assert imported.status_code == 200
    assert imported.json()["imported"] >= 1
    assert imported.json()["skipped"] >= 0
    assert client.get(f"/api/reports/{created['id']}").status_code == 200


def test_import_skips_duplicate_reports_without_overwriting_existing_data():
    created = client.post(
        "/api/analyze",
        json={
            "resume_text": "Jane jane@example.com Summary React TypeScript Docker FastAPI built portfolio product.",
            "jd_text": "Role requires React, TypeScript, Docker, FastAPI, SQL, and Testing.",
        },
    ).json()
    export_payload = {
        "version": "jobfit-rag-export-v1",
        "exported_at": "2026-06-06T00:00:00Z",
        "reports": [created],
    }
    changed_duplicate = dict(created)
    changed_duplicate["summary"] = "This duplicate import should not overwrite local data."

    imported = client.post(
        "/api/reports-import",
        json={**export_payload, "reports": [changed_duplicate]},
    )
    existing = client.get(f"/api/reports/{created['id']}").json()

    assert imported.status_code == 200
    assert imported.json()["imported"] == 0
    assert imported.json()["skipped"] == 1
    assert existing["summary"] == created["summary"]


def test_import_rejects_unsupported_export_version_without_deleting_existing_reports():
    created = client.post(
        "/api/analyze",
        json={
            "resume_text": "Jane jane@example.com Summary React TypeScript Docker FastAPI built portfolio product.",
            "jd_text": "Role requires React, TypeScript, Docker, FastAPI, SQL, and Testing.",
        },
    ).json()

    response = client.post(
        "/api/reports-import",
        json={"version": "wrong-version", "exported_at": "2026-06-06T00:00:00Z", "reports": []},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported export version"
    assert client.get(f"/api/reports/{created['id']}").status_code == 200


def test_missing_report_endpoints_return_404():
    missing_id = "missing-report-id"

    detail = client.get(f"/api/reports/{missing_id}")
    deleted = client.delete(f"/api/reports/{missing_id}")

    assert detail.status_code == 404
    assert detail.json()["detail"] == "Report not found"
    assert deleted.status_code == 404
    assert deleted.json()["detail"] == "Report not found"


def test_application_tracker_create_list_and_update_status():
    created = client.post(
        "/api/applications",
        json={
            "company": "Acme AI",
            "role": "AI Application Developer",
            "status": "target",
            "next_action": "Tailor resume and prepare case study.",
        },
    )

    assert created.status_code == 200
    item = created.json()
    assert item["company"] == "Acme AI"
    assert item["status"] == "target"
    assert item["next_action"] == "Tailor resume and prepare case study."

    updated = client.patch(
        f"/api/applications/{item['id']}",
        json={"status": "applied", "next_action": "Follow up in 7 days."},
    )

    assert updated.status_code == 200
    assert updated.json()["status"] == "applied"
    assert updated.json()["next_action"] == "Follow up in 7 days."

    listed = client.get("/api/applications")

    assert listed.status_code == 200
    assert any(entry["id"] == item["id"] for entry in listed.json())


def test_missing_application_patch_returns_404():
    response = client.patch(
        "/api/applications/missing-application-id",
        json={"status": "applied"},
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Application not found"
