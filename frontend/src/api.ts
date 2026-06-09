import type { ApplicationItem, AnalysisReport, ReportsExport, ReportsImportResult, ResumeMatrixReport } from "./types";
import { buildAppliedApplicationPayload } from "./applicationTracker";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

function apiErrorMessage(action: string, response: Response): string {
  return `${action} failed with status ${response.status}. Check the backend logs for details.`;
}

export async function analyzeFit(resumeText: string, jdText: string): Promise<AnalysisReport> {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText, jd_text: jdText }),
  });
  if (!response.ok) throw new Error(apiErrorMessage("Request", response));
  return response.json();
}

export async function fetchReports(): Promise<AnalysisReport[]> {
  const response = await fetch(`${API_BASE_URL}/api/reports`);
  if (!response.ok) throw new Error(apiErrorMessage("Request", response));
  return response.json();
}

export async function runMatrix(jdText: string, resumeText: string, matrixResumeText: string): Promise<ResumeMatrixReport> {
  const response = await fetch(`${API_BASE_URL}/api/resume-matrix`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jd_text: jdText,
      versions: [
        { label: "baseline", resume_text: resumeText },
        { label: "tailored", resume_text: matrixResumeText },
      ],
    }),
  });
  if (!response.ok) throw new Error(apiErrorMessage("Request", response));
  return response.json();
}

export async function fetchApplications(): Promise<ApplicationItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/applications`);
  if (!response.ok) throw new Error(apiErrorMessage("Request", response));
  return response.json();
}

export async function createApplication(payload: {
  company: string;
  role: string;
  next_action: string;
  report_id: string | null;
}): Promise<ApplicationItem> {
  const response = await fetch(`${API_BASE_URL}/api/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(apiErrorMessage("Request", response));
  return response.json();
}

export async function updateApplicationStatus(item: ApplicationItem): Promise<ApplicationItem> {
  const response = await fetch(`${API_BASE_URL}/api/applications/${item.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildAppliedApplicationPayload(item)),
  });
  if (!response.ok) throw new Error(apiErrorMessage("Request", response));
  return response.json();
}

export async function fetchReport(id: string): Promise<AnalysisReport> {
  const response = await fetch(`${API_BASE_URL}/api/reports/${id}`);
  if (!response.ok) throw new Error(apiErrorMessage("Request", response));
  return response.json();
}

export async function removeReport(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/reports/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(apiErrorMessage("Request", response));
}

export async function exportReports(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/reports-export`);
  if (!response.ok) throw new Error(apiErrorMessage("Request", response));
  return response.text();
}

export async function importReports(payload: ReportsExport): Promise<ReportsImportResult> {
  const response = await fetch(`${API_BASE_URL}/api/reports-import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(apiErrorMessage("Request", response));
  return response.json();
}

export async function parseResumeFile(file: File): Promise<{ text: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE_URL}/api/parse-resume`, { method: "POST", body: formData });
  if (!response.ok) throw new Error(apiErrorMessage("Request", response));
  return response.json();
}
