# Job Post Intake Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use the executing-plans skill to implement this plan task-by-task.

**Goal:** Let users work with real company job postings safely by adding a local-first job post intake workflow without scraping login-only or prohibited sites.

**Architecture:** Start with manual paste and source metadata. Keep analysis input as plain JD text. Add URL/source fields only as local reference data. Defer any automatic URL reading until there is an explicit allowlist, visible user action, and safety checks.

**Tech Stack:** React, TypeScript, FastAPI/Pydantic if persistence is needed, SQLite local storage, existing analyzer API.

---

## Safety boundary

Do not build general-purpose scraping by default.

Allowed for this product scope:

- user manually pastes public job description text
- user records company name, role, source URL, and captured date
- user imports a copied public posting as text
- future optional fetch only for public pages that do not require login and are not blocked by site terms or robots policy

Do not do by default:

- scrape LinkedIn, Boss Zhipin, Liepin, Lagou, or other login-gated sites
- bypass login, paywalls, rate limits, bot checks, or robots restrictions
- store cookies or user sessions
- run background crawlers
- bulk collect jobs
- send pasted resume/JD text to third-party services unless the user explicitly enables optional API behavior

If a site requires login or blocks automated access, the user should paste the JD text manually.

---

### Task 1: Add Job Source Fields To The Existing Form

**Files:**
- Modify: `frontend/src/types.ts`
- Modify: `frontend/src/main.tsx`

**Step 1: Add UI copy**

Add copy fields:

```ts
jobSourceTitle: string;
jobCompany: string;
jobRole: string;
jobSourceUrl: string;
jobCapturedAt: string;
jobSourceHelp: string;
```

Suggested English text:

```ts
jobSourceTitle: "Job source",
jobCompany: "Company",
jobRole: "Role",
jobSourceUrl: "Source URL",
jobCapturedAt: "Captured date",
jobSourceHelp: "Paste public JD text below. Use source fields for your own reference; do not scrape login-only pages.",
```

Suggested Chinese text:

```ts
jobSourceTitle: "岗位来源",
jobCompany: "公司",
jobRole: "岗位",
jobSourceUrl: "来源 URL",
jobCapturedAt: "采集日期",
jobSourceHelp: "下面粘贴公开 JD 文本。来源字段只作本地记录；不要爬取需要登录的页面。",
```

**Step 2: Add local state**

In `App`, add local state:

```ts
const [jobCompany, setJobCompany] = useState("");
const [jobRole, setJobRole] = useState("");
const [jobSourceUrl, setJobSourceUrl] = useState("");
const [jobCapturedAt, setJobCapturedAt] = useState("");
```

These fields do not need backend persistence in the first implementation.

**Step 3: Add a small Job Source panel near the JD textarea**

Add a compact field group before or above the JD textarea:

- Company input
- Role input
- Source URL input
- Captured date input, type `date`
- helper text warning against login-only scraping

Use existing styling classes where possible. Do not add broad CSS changes.

**Step 4: Update samples**

When loading a built-in sample, fill company/role/source fields with safe demo values. Use fake or generic source URLs only, for example:

```text
https://example.com/jobs/ai-application-developer
```

Do not use a real company posting unless the text is intentionally public and safe to include.

**Step 5: Verify**

Run:

```powershell
npm --prefix D:\VsCodeProjects\jobfit-rag\frontend run build
.\scripts\check-accessibility.ps1
.\scripts\verify-local.ps1
```

Expected:

- frontend build passes
- accessibility check passes
- `PASS verify-local`

Manual accessibility check:

- each new input has a visible label or accessible name
- helper text does not replace labels
- date input is reachable by keyboard
- Source URL is optional and does not auto-fetch anything

---

### Task 2: Include Job Source In Exported Artifacts

**Files:**
- Modify: `frontend/src/exportMarkdown.ts`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/types.ts` if a small type is useful

**Step 1: Create a local source metadata object**

Do not send source metadata to the analyzer unless backend schema is deliberately changed.

Use it only for exports:

```ts
const jobSource = {
  company: jobCompany.trim(),
  role: jobRole.trim(),
  sourceUrl: jobSourceUrl.trim(),
  capturedAt: jobCapturedAt,
};
```

**Step 2: Extend export helper signatures minimally**

Add optional job source metadata to Markdown exports.

Example section:

```markdown
## Job Source

- Company: ...
- Role: ...
- Source URL: ...
- Captured: ...
```

Only include non-empty fields.

**Step 3: Preserve existing export behavior**

If all source fields are empty, existing exported Markdown should remain nearly unchanged.

**Step 4: Verify**

Run:

```powershell
npm --prefix D:\VsCodeProjects\jobfit-rag\frontend run build
.\scripts\verify-local.ps1
```

Expected: PASS.

---

### Task 3: Add Optional Public URL Intake Plan Only After Manual Flow Works

**Files:**
- Create a follow-up plan only, do not implement fetch yet unless explicitly requested.

**Future design constraints:**

- user clicks an explicit `Fetch public JD` button
- only `http`/`https` URLs are accepted
- no credentials, cookies, or auth headers
- no redirects to private network ranges
- no login-only sites
- no bulk crawl
- no scheduled crawl
- response size limit
- timeout
- strip scripts/styles
- show fetched text for user review before analysis
- never hide the source from the user

**Recommended first implementation path:**

- backend endpoint: `POST /api/job-post-preview`
- request: `{ "url": "https://..." }`
- response: `{ "title": "...", "text": "...", "source_url": "..." }`
- deny non-public or unsafe URLs
- save nothing automatically

**Verification:**

- unit tests for URL validation
- negative tests for localhost/private IP/file URLs
- manual test against a static public demo page only

---

### Task 4: Review

Use:

- `code-reviewer` for general correctness
- `security-reviewer` if any URL fetching or parsing code is added
- `a11y-architect` if new form controls are added

Fix all CRITICAL/HIGH before calling the task complete.

**Do not commit unless the user explicitly asks.**
