# Runtime DOM Tabs Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Add runtime DOM coverage for Report tabs so keyboard behavior and ARIA state are verified in a running DOM, not only by source-string checks.

**Architecture:** Keep the existing source accessibility check as a fast smoke gate. Add a separate runtime test path when a frontend test runner is intentionally configured; do not install dependencies as part of this plan unless the user explicitly approves it.

**Tech Stack:** React, TypeScript, ARIA tabs pattern, current PowerShell source check, optional future Playwright or Vitest + Testing Library.

---

## Current limitation

`scripts/check-accessibility.ps1` checks that expected strings exist in `frontend/src/main.tsx` and `frontend/src/styles.css`.

This is useful for fast local verification, but it cannot prove runtime behavior:

- a rendered tab actually updates `aria-selected` after click or keyboard input
- inactive tabpanels are actually hidden in the DOM
- `aria-controls` points to an existing element after render
- `ArrowLeft`, `ArrowRight`, `Home`, and `End` change the selected tab
- focus moves to the newly selected tab after keyboard navigation

Runtime DOM tests should cover those behaviors directly.

## Dependency constraint

Do not install test dependencies during this plan unless the user explicitly asks.

If Playwright, Vitest, or Testing Library are not already configured, record implementation as blocked by missing test dependencies and keep this plan as the handoff for future execution.

---

### Task 1: Inspect Existing Frontend Test Capability

**Files:**
- Read: `frontend/package.json`
- Read if present: frontend test config files such as `vitest.config.*`, `playwright.config.*`, or `frontend/src/**/*.test.*`

**Step 1: Check package scripts**

Read `frontend/package.json` and look for existing scripts such as:

```json
"test": "...",
"test:unit": "...",
"test:e2e": "..."
```

**Step 2: Check installed test framework config**

Search for existing frontend test configs:

```text
vitest.config.*
playwright.config.*
```

**Step 3: Decide path**

Use this order:

1. If Vitest + Testing Library already exists, use it for component-level DOM tests.
2. If Playwright already exists, use it for browser-level DOM tests.
3. If neither exists, stop before implementation and report blocked by missing test dependencies.

**Expected:** no dependency install occurs.

---

### Task 2: Add Runtime Tabs Test If Vitest Is Already Configured

**Files:**
- Create only if framework exists: `frontend/src/report-tabs.test.tsx`
- Modify only if needed: existing frontend test setup file

**Step 1: Render a report state with tabs visible**

Use the smallest available app/component render path that shows `ReportView` tabs.

If `ReportView` is not exported, do not perform a broad refactor. Prefer a tiny, explicit export only if it does not change runtime behavior.

**Step 2: Test initial ARIA state**

Assert:

- `role="tablist"` exists
- every rendered `role="tab"` has `aria-controls`
- each `aria-controls` value points to an existing `role="tabpanel"`
- active tab has `aria-selected="true"`
- inactive tabs have `aria-selected="false"`
- inactive panels have `hidden`

**Step 3: Test keyboard navigation**

From the active tab, simulate:

- `ArrowRight`: selects the next tab and moves focus
- `ArrowLeft`: selects the previous tab and moves focus
- `Home`: selects the first tab and moves focus
- `End`: selects the last tab and moves focus

**Step 4: Run focused test**

Run only if dependencies already exist:

```powershell
npm --prefix D:\VsCodeProjects\jobfit-rag\frontend run test -- report-tabs
```

Expected: PASS.

**Step 5: Run local gate**

```powershell
.\scripts\verify-local.ps1
```

Expected: `PASS verify-local`.

---

### Task 3: Add Runtime Tabs Test If Playwright Is Already Configured

**Files:**
- Create only if framework exists: existing Playwright tests directory test file, for example `frontend/tests/report-tabs.spec.ts` or `tests/report-tabs.spec.ts`

**Step 1: Start only allowed local server path**

Do not start Docker. Use the existing local frontend runner only if the test framework expects a live page and local server startup is allowed for the task.

```powershell
.\scripts\run-frontend-local.ps1 -BackendUrl http://127.0.0.1:8001 -Port 3000
```

If backend or fixture state is required and unavailable, stop and report the blocker.

**Step 2: Verify rendered tab semantics**

Assert in browser DOM:

- `role="tablist"` exists
- `role="tab"` elements exist
- `aria-controls` targets exist
- one tab has `aria-selected="true"`
- inactive panels are hidden

**Step 3: Verify keyboard behavior**

Focus the first tab and press:

- `ArrowRight`
- `ArrowLeft`
- `Home`
- `End`

After each key, assert selected tab and focused tab match.

**Step 4: Run focused test**

Use the existing Playwright script only if already present.

Expected: PASS.

**Step 5: Run local gate**

```powershell
.\scripts\verify-local.ps1
```

Expected: `PASS verify-local`.

---

### Task 4: If Runtime Test Dependencies Are Missing

**Files:**
- Do not create test files
- Update documentation only if useful for handoff

**Step 1: Record blocker**

Report:

```text
Runtime DOM tabs tests are blocked because no frontend runtime DOM test runner is currently configured. No dependencies were installed by request.
```

**Step 2: Keep current verification**

Run:

```powershell
.\scripts\verify-local.ps1
```

Expected: `PASS verify-local`.

**Step 3: Recommended future dependency choice**

Prefer one of:

- Vitest + Testing Library for component-level tab behavior tests
- Playwright for browser-level keyboard/focus behavior tests

Do not add both unless there is a clear reason.

---

### Task 5: Review

**Files:**
- Any new test files
- Any changed docs

**Step 1: Use code review**

Use `code-reviewer` after implementation or documentation updates.

Ask the reviewer to check:

- no dependency install occurred
- no Docker usage was added
- tab runtime behavior assertions match ARIA behavior
- no sensitive resume/JD/API key/Authorization content appears in tests or docs
- no broad `main.tsx` refactor was introduced just for tests

**Expected:** no CRITICAL/HIGH findings.

**Do not commit unless the user explicitly asks.**
