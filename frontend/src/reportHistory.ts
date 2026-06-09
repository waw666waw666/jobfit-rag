import type { AnalysisReport, ReportListItem } from "./types";

export function isCompareReportSelected(compareReports: AnalysisReport[], reportId: string) {
  return compareReports.some((item) => item.id === reportId);
}

export function removeCompareReport(compareReports: AnalysisReport[], reportId: string) {
  return compareReports.filter((item) => item.id !== reportId);
}

export function appendCompareReport(compareReports: AnalysisReport[], report: AnalysisReport) {
  return [...compareReports.slice(-1), report];
}

export function clearDeletedReport(report: AnalysisReport | null, deletedReport: Pick<ReportListItem, "id">) {
  return report?.id === deletedReport.id ? null : report;
}
