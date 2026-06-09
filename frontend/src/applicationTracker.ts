import type { ApplicationItem } from "./types";

export type ApplicationDraft = {
  company: string;
  role: string;
  nextAction: string;
};

export type CreateApplicationPayload = {
  company: string;
  role: string;
  next_action: string;
  report_id: string | null;
};

export type AppliedApplicationPayload = {
  status: "applied";
  next_action: string;
};

const defaultAppliedNextAction = "Follow up in 7 days.";

export function buildApplicationPayload(
  draft: ApplicationDraft,
  reportId?: string | null,
): CreateApplicationPayload | null {
  const company = draft.company.trim();
  const role = draft.role.trim();
  if (!company || !role) return null;
  return {
    company,
    role,
    next_action: draft.nextAction.trim(),
    report_id: reportId ?? null,
  };
}

export function emptyApplicationDraft(): ApplicationDraft {
  return {
    company: "",
    role: "",
    nextAction: "",
  };
}

export function buildAppliedApplicationPayload(
  item: Pick<ApplicationItem, "next_action">,
): AppliedApplicationPayload {
  return {
    status: "applied",
    next_action: item.next_action || defaultAppliedNextAction,
  };
}
