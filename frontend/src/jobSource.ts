import type { Copy } from "./types";

export type JobSourceMetadata = {
  company?: string;
  role?: string;
  sourceUrl?: string;
  capturedAt?: string;
};

export function normalizeJobSource(jobSource: JobSourceMetadata): JobSourceMetadata {
  return {
    company: jobSource.company?.trim() ?? "",
    role: jobSource.role?.trim() ?? "",
    sourceUrl: jobSource.sourceUrl?.trim() ?? "",
    capturedAt: jobSource.capturedAt?.trim() ?? "",
  };
}

export function toJobSourceMarkdownSection(t: Copy, jobSource?: JobSourceMetadata) {
  const normalized = normalizeJobSource(jobSource ?? {});
  const lines = [
    [t.jobCompany, normalized.company],
    [t.jobRole, normalized.role],
    [t.jobSourceUrl, normalized.sourceUrl],
    [t.jobCapturedAt, normalized.capturedAt],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => `- ${label}: ${value}`);

  return lines.length ? `## ${t.jobSourceTitle}\n\n${lines.join("\n")}\n\n` : "";
}
