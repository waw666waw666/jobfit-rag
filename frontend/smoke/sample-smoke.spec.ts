import { expect, test } from "@playwright/test";

test("sample-only analyze flow renders report tabs", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "JobFit RAG" })).toBeVisible();

  await page.getByRole("button", { name: "Frontend sample" }).click();
  await expect(page.locator("#job-company")).toHaveValue("Example Studio");
  await expect(page.locator("#resume-text")).toContainText("Frontend developer");
  await expect(page.locator("#jd-text")).toContainText("Frontend Engineer");

  await page.getByRole("button", { name: "Analyze Fit" }).click();

  await expect(page.getByRole("tablist", { name: "Report sections" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Overview" })).toHaveAttribute("aria-selected", "true");

  await page.getByRole("tab", { name: "Skills" }).click();
  await expect(page.getByRole("tab", { name: "Skills" })).toHaveAttribute("aria-selected", "true");
  const skillsPanel = page.locator("#report-panel-skills");
  await expect(skillsPanel).toBeVisible();
  await expect(skillsPanel.getByRole("heading", { name: "Matched Skills" })).toBeVisible();
});
