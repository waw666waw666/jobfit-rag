# Accessible Tabs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Improve report tab accessibility by adding stable tab IDs, panel IDs, ARIA wiring, and keyboard navigation.

**Architecture:** Keep existing tab state in `main.tsx`. Add small helper functions for tab IDs and a keyboard handler; update existing tab buttons and tabpanel attributes without changing visual CSS or tab content.

**Tech Stack:** React, TypeScript, ARIA tabs pattern, existing PowerShell accessibility source check.

---

### Task 1: Add ARIA Wiring For Tabs

**Files:**
- Modify: `frontend/src/main.tsx`
- Modify: `scripts/check-accessibility.ps1`

**Step 1: Add helper functions near tab rendering or component helpers**

In `frontend/src/main.tsx`, add:

```tsx
function tabId(tab: Tab) {
  return `report-tab-${tab}`;
}

function panelId(tab: Tab) {
  return `report-panel-${tab}`;
}
```

If there are already helper functions near the bottom, place these nearby.

**Step 2: Wire tab buttons**

Change each tab button in the tablist to include:

```tsx
id={tabId(tab)}
aria-controls={panelId(tab)}
aria-selected={activeTab === tab}
tabIndex={activeTab === tab ? 0 : -1}
```

Keep existing `role="tab"`, `type="button"`, `onClick`, and class behavior.

**Step 3: Wire the tab panel**

Change the tabpanel container to include:

```tsx
id={panelId(activeTab)}
aria-labelledby={tabId(activeTab)}
```

Keep existing `role="tabpanel"`.

**Step 4: Run frontend build**

Run:

```powershell
npm --prefix "D:\VsCodeProjects\jobfit-rag\frontend" run build
```

Expected: `tsc -b && vite build` passes.

**Step 5: Update accessibility source checks**

In `scripts/check-accessibility.ps1`, add checks for:

```powershell
Assert-Contains "tab id" $main 'id={tabId(tab)}'
Assert-Contains "tab controls" $main 'aria-controls={panelId(tab)}'
Assert-Contains "tab tabindex" $main 'tabIndex={activeTab === tab ? 0 : -1}'
Assert-Contains "tabpanel id" $main 'id={panelId(activeTab)}'
Assert-Contains "tabpanel labelledby" $main 'aria-labelledby={tabId(activeTab)}'
```

**Step 6: Run accessibility check**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File D:\VsCodeProjects\jobfit-rag\scripts\check-accessibility.ps1
```

Expected: `PASS accessibility`

---

### Task 2: Add Keyboard Navigation

**Files:**
- Modify: `frontend/src/main.tsx`

**Step 1: Add tab order constant**

Create one shared tab order constant and use it for both rendering and keyboard navigation:

```tsx
const reportTabs: Tab[] = ["overview", "readiness", "action", "skills", "evidence", "trace", "rewrite", "tailored", "case", "interview", "proof", "structure", "learning", "bullets"];
```

Replace any local `Object.keys(t.tabs) as Tab[]` tab render source with `reportTabs` so the keyboard handler and render order cannot drift.

**Step 2: Add keyboard handler**

Add:

```tsx
function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, tab: Tab) {
  const index = reportTabs.indexOf(tab);
  const lastIndex = reportTabs.length - 1;
  let nextIndex = index;

  if (event.key === "ArrowRight") nextIndex = index === lastIndex ? 0 : index + 1;
  else if (event.key === "ArrowLeft") nextIndex = index === 0 ? lastIndex : index - 1;
  else if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = lastIndex;
  else return;

  event.preventDefault();
  const nextTab = reportTabs[nextIndex];
  setActiveTab(nextTab);
  window.requestAnimationFrame(() => document.getElementById(tabId(nextTab))?.focus());
}
```

**Step 3: Attach handler to tab buttons**

Add:

```tsx
onKeyDown={(event) => handleTabKeyDown(event, tab)}
```

**Step 4: Verify build**

Run:

```powershell
npm --prefix "D:\VsCodeProjects\jobfit-rag\frontend" run build
```

Expected: PASS.

**Step 5: Review**

Use `code-reviewer`. Ask the reviewer to include TypeScript/React behavior and accessibility keyboard behavior as explicit review lenses.

Expected: no CRITICAL/HIGH findings.

**Do not commit unless the user explicitly asks.**
