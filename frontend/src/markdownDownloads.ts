import type { Language } from "./types";

export type MarkdownDownload = "report" | "interview-pack" | "portfolio-case-study";

const markdownPrefixes: Record<MarkdownDownload, string> = {
  report: "jobfit-report",
  "interview-pack": "jobfit-interview-pack",
  "portfolio-case-study": "jobfit-portfolio-case-study",
};

export function buildMarkdownFilename(kind: MarkdownDownload, language: Language, reportId?: string) {
  return `${markdownPrefixes[kind]}-${language}-${reportId?.slice(0, 8) ?? "unknown"}.md`;
}

export function downloadMarkdownFile(markdown: string, filename: string) {
  downloadTextFile(markdown, filename, "text/markdown;charset=utf-8");
}

export function downloadJsonFile(payload: string, filename: string) {
  downloadTextFile(payload, filename, "application/json;charset=utf-8");
}

function downloadTextFile(payload: string, filename: string, type: string) {
  const blob = new Blob([payload], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
