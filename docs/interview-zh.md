# JobFit RAG 中文面试包

这份文档用于中文面试、作品集讲解、简历项目复盘。

## 1. 30 秒介绍

JobFit RAG 是一个 Docker-first 的本地 AI 求职辅助工具。用户输入简历和目标 JD 后，系统会生成匹配分数、技能缺口、证据链、简历改写建议、面试包、作品集案例和下一步行动清单。

我做这个项目的重点不是再做一个聊天框，而是把 AI 输出做成可解释、可验证、可导出、能直接服务求职流程的产品。

## 2. 2 分钟讲稿

这个项目解决的问题是：很多简历分析工具只给一个分数，但求职者真正需要知道的是“我哪里有证据，哪里只是关键词，下一步该补什么作品”。

所以我设计了一个本地优先的工作流。前端用 React 和 TypeScript，后端用 FastAPI，数据存在本地 SQLite，整体用 Docker Compose 启动。默认情况下不需要 API key，也不跑本地大模型，系统会用 deterministic analyzer 生成完整报告。如果配置了 OpenAI-compatible API，就做语义评分和措辞优化；如果 API 失败，会自动回到本地分析。

报告不是只有分数。它包括 evidence trace、evidence quality、structure checks、learning plan、proof plan、portfolio readiness、action board、interview pack 和 portfolio case study export。这样用户可以从“我适不适合这个岗位”继续推进到“我要补哪个项目、怎么讲、怎么导出给面试使用”。

我还补了工程化证明：`reset-demo.ps1` 可以重置演示数据，`smoke.ps1` 会跑 Docker build、backend tests、frontend build、服务健康、API smoke 和 secret scan。GitHub Actions 也有 no-secret 的 CI-lite workflow，复用同一套 Docker 验证流程。

这个项目的核心价值是：用轻量架构做出完整 AI 产品闭环，并且能解释清楚数据边界、失败回退、验证方式和求职场景。

## 3. 架构讲法

```text
Browser
-> React + TypeScript frontend
-> FastAPI backend
-> deterministic analyzer
-> optional OpenAI-compatible refinement
-> SQLite local persistence
-> Markdown / JSON / interview pack / portfolio case study exports
```

我刻意没有上 PostgreSQL、Redis、vector DB、本地 LLM 或 worker queue。

原因是这个项目的核心任务是一份简历和一份 JD 的本地分析，单用户、低成本、可复现更重要。SQLite 足够支撑 report history 和 application tracker；deterministic fallback 保证没有 token 也能跑；Docker Compose 保证弱笔记本也能干净启动。

## 4. 隐私讲法

这个项目涉及简历和求职记录，所以我把安全默认值设计成本地：

- `.env` 不提交
- `data/` 不提交
- SQLite 文件在本地 `./data/jobfit.sqlite3`
- API key 为空时仍然能完整工作
- API 失败时自动 fallback
- smoke 脚本包含 secret scan
- exported JSON / Markdown 被明确标记为可能含隐私数据

我不会说它是企业级安全系统，但它对个人求职场景有清晰的数据边界。

## 5. CI 讲法

CI-lite workflow 在 `.github/workflows/smoke.yml`。

它不需要 secrets，跑的是：

1. checkout
2. Docker version
3. ensure ripgrep
4. `reset-demo.ps1 -NoBackup`
5. `smoke.ps1`
6. `docker compose ps`
7. `docker compose down`

这让本地演示和 GitHub review 用同一套验证故事：Docker reset，Docker smoke，无 secret 依赖。

## 6. Evaluation 讲法

我加了 lightweight evaluation fixtures，在 `docs/evaluation-fixtures.json`。

它不是去断言生成文案的每个字，而是验证更稳定的产品行为：

- 分数区间
- matched skills
- missing skills
- API mode
- readiness score
- action board 数量和来源
- report sections 是否存在

脚本是 `scripts/evaluate-fixtures.ps1`，会直接调用正在运行的 `/api/analyze`。它也被接进了 `smoke.ps1`，所以本地和 CI 的验证都会覆盖这些固定样例。

这能说明我考虑了 AI 输出稳定性，而不是只靠一次手动演示。

## 7. Markdown Quality 讲法

我还加了 `scripts/check-markdown-quality.ps1`。

因为这个项目的导出结果本身就是用户要拿去面试和作品集复用的交付物，所以不能只证明“按钮能点”，还要证明导出的报告结构完整。

这个脚本会调用 `/api/analyze`，检查三类导出结构：

- full report Markdown
- interview pack Markdown
- portfolio case study Markdown

它重点检查章节是否完整，比如 score breakdown、readiness、evidence trace、proof plan、interview pack、STAR answers、architecture、trade-offs、next actions 和 disclaimer。

它也被接进了 `smoke.ps1`。

## 8. API Contract 讲法

我还加了 API contract pack。

FastAPI 本身会生成 `/openapi.json`，但我没有只停在“它能生成”。我加了 `scripts/check-api-contract.ps1`，会从运行中的后端拉取 OpenAPI，默认只和 `docs/openapi.json` 快照对比，不写 tracked 文件，然后检查关键 paths、methods、schemas 和 fields。

它会检查 `/api/analyze`、report history、import/export、resume parsing、application tracker 等接口，也会检查 `AnalysisReport-Output`、`PortfolioReadiness`、`ActionBoardItem`、`PortfolioExport`、`InterviewPack` 等 schema。

这说明后端接口也是被验证的，不只是前端能点。

## 9. Error Handling 讲法

我还补了 negative path gate：`scripts/check-negative-paths.ps1`。

它会调用正在运行的 backend，验证几类容易被 demo 忽略的失败场景：

- `/api/analyze` 缺必填字段时返回 `422`
- 上传不支持的简历类型时返回稳定 `400`
- 读取或删除不存在的 report 时返回 `404`
- import 错误版本时返回 `400`，并且不会删掉已有 report
- 更新不存在的 application 时返回 `404`

这能说明我不是只做 happy path，而是把 API contract、错误响应和数据不破坏也纳入 smoke 验证。

## 10. Data Integrity 讲法

我还加了 `scripts/check-data-integrity.ps1`。

它验证 report JSON backup/restore 的核心数据边界：

- 先通过 `/api/analyze` 创建 report
- 通过 `/api/reports-export` 导出
- 删除该 report
- 通过 `/api/reports-import` 恢复
- 校验 ID、score、summary 没变
- 再导入一次同 ID report，必须 `skipped=1`
- 重复导入不能覆盖本地已有 report

这能说明本地数据不是“能存就行”，而是 backup/restore、重复导入、非覆盖语义都被验证。

## 11. Accessibility 讲法

我还补了 `scripts/check-accessibility.ps1`。

它做的是轻量级 frontend accessibility gate，不宣称完整 WCAG 认证，但会检查关键 UI 语义：

- resume/JD textarea 有稳定 `id` 和 `aria-describedby`
- 上传控件和 tracker 输入有 accessible label
- language / demo toggle 有 `aria-pressed`
- report tabs 有 `tablist`、`tab`、`aria-selected`、`tabpanel`
- action/error 区域有 `aria-live`
- JSON import 用可聚焦按钮触发隐藏 file input
- CSS 有 `:focus-visible` 和 `.visually-hidden`

这能说明我不只是做“看起来能用”的前端，也会考虑键盘操作、状态语义和辅助技术。

## 12. Resume Matrix 讲法

我还加了 resume version matrix。

它解决的是求职里很真实的问题：同一个 JD 下，基础版简历和定制版简历到底有没有变好。`POST /api/resume-matrix` 接收一份 JD 和 2-4 个简历版本，返回最佳版本、分数变化、gained skills、remaining gaps、readiness score 和 recommendations。

我特意没有把 matrix run 默认写进 report history，因为它更像实验和调试流程。只有用户真正分析单版简历时，才存正式 report。

## 13. 最值得展示的功能

优先展示这些：

1. `Analyze Fit`：从简历和 JD 生成完整报告。
2. `Trace`：展示每个技能的 resume evidence、JD evidence、gap reason。
3. `Readiness`：把复杂报告压缩成作品集准备度。
4. `Action Board`：把缺口变成可执行任务。
5. `Proof Plan`：告诉用户用什么作品补证据。
6. `Interview`：生成面试定位、STAR、风险说明。
7. `Export Portfolio Case Study`：导出 README-ready 案例。
8. `reset-demo.ps1` 和 `smoke.ps1`：证明项目可复现、可验证。

## 14. 简历 Bullet

中文：

- 构建 Docker-first 本地 AI 求职分析工具，使用 React、TypeScript、FastAPI、SQLite，实现简历/JD 匹配、证据链、作品集准备度、行动清单和面试包导出。
- 设计 deterministic fallback + optional OpenAI-compatible refinement，让系统在无 API key、无本地 LLM、无 GPU 的弱笔记本环境下仍可完整运行。
- 实现本地验证流程，包含 Docker build、backend tests、frontend production build、runtime health、API smoke 和 secret scan，并补充 no-secret GitHub Actions workflow。
- 增加 lightweight evaluation fixtures，使用固定 resume/JD 样例验证分数区间、技能匹配、缺口、readiness、action board 和报告结构稳定性。
- 增加 Markdown quality gate，验证 full report、interview pack、portfolio case study 三类导出结构包含关键章节。
- 增加 API contract pack，导出 OpenAPI snapshot，并验证关键 routes、schemas 和 fields。
- 增加 negative path gate，验证无效输入、不支持上传、缺失资源和错误导入版本能稳定失败且不破坏已有数据。
- 增加 data integrity gate，验证 report 导出/导入 roundtrip、重复导入跳过、以及不覆盖本地已有数据。
- 增加 accessibility gate 和前端语义优化，覆盖输入标签、live region、tab 语义、键盘友好的 JSON import 和 focus-visible 状态。
- 增加 resume version matrix，对比同一 JD 下基础版和定制版简历的分数变化、增量技能、剩余缺口和最佳版本。

English:

- Built a Dockerized local-first AI job-fit analyzer with React, TypeScript, FastAPI, SQLite, deterministic fallback scoring, and optional OpenAI-compatible refinement.
- Designed an explainable resume/JD workflow that turns match scores into evidence traces, proof plans, interview packs, action boards, and README-ready portfolio case studies.
- Implemented Docker-first verification with backend tests, frontend production build, runtime health checks, API smoke checks, local secret scanning, and no-secret GitHub Actions CI.
- Added lightweight evaluation fixtures that validate score ranges, matched skills, missing skills, readiness, action items, and report sections through the live analyze API.
- Added a Markdown quality gate that verifies full report, interview pack, and portfolio case study export structures include required sections.
- Added an API contract pack that exports OpenAPI and verifies required routes, schemas, and fields from the running backend.
- Added a negative path gate that verifies invalid payloads, unsupported uploads, missing resources, and unsupported import versions fail safely.
- Added a data integrity gate that verifies report export/import roundtrip, duplicate skipping, and non-overwrite safety.
- Added an accessibility gate and frontend semantics for labeled inputs, live regions, tabs, keyboard-friendly JSON import, and focus-visible states.
- Added a resume version matrix that compares baseline and tailored resumes against one JD with score delta, gained skills, remaining gaps, and best version.

## 15. 常见追问

### 为什么不用 vector database？

当前核心场景是一份简历对一份 JD，不是大规模文档检索。引入 vector DB 会增加部署、数据管理和资源成本，但收益不明显。我保留了 optional embedding / semantic scoring 的扩展点，等需求变成多简历、多岗位、多文档检索时再加更合理。

### 为什么不用本地 LLM？

用户环境是弱笔记本，没有服务器和 GPU。本地 LLM 会带来模型下载、显存、速度和维护成本。这个项目选择 deterministic fallback + optional API refinement，保证无 token 时能跑，有 token 时更好。

### 这个算 RAG 吗？

它不是传统“向量库 + 文档检索 + 生成答案”的重型 RAG 平台，而是 RAG-style 的 evidence-grounded workflow。核心是把输出绑定到 resume evidence 和 JD evidence，减少空泛生成，并让缺口可解释。

### 最大技术难点是什么？

难点不是调用模型，而是把 AI 输出变成稳定产品结构：schema、fallback、evidence trace、导出格式、历史记录、演示数据、验证脚本、隐私边界都要闭环。

### 你怎么验证 AI 输出稳定？

我把验证分成两层。单元测试覆盖 analyzer 的函数和 schema；evaluation fixtures 通过真实 `/api/analyze` 入口跑固定 resume/JD 样例。fixture 不断言大段生成文案，而是看稳定行为：分数范围、matched/missing skills、readiness、action board、关键 report sections。

### 你怎么验证导出质量？

我没有只看下载按钮，而是加了 Markdown quality gate。它通过 API 生成 report，然后检查 full report、interview pack、portfolio case study 三类导出结构是否包含关键章节。这样可以避免导出文件缺 readiness、proof plan、disclaimer 这类关键内容。

### 你怎么保证前后端接口不乱变？

我加了 API contract check。它从运行中的 FastAPI 后端拉 `/openapi.json`，默认和 `docs/openapi.json` 快照对比，再检查关键 endpoint、schema 和字段；只有显式用 `-UpdateSnapshot` 才刷新快照。这样如果 `AnalysisReport` 里重要字段被删掉，或者某个 endpoint 消失，smoke 会失败。

### 你怎么验证错误处理？

我加了 `scripts/check-negative-paths.ps1`，专门测 happy path 之外的请求。它检查缺字段、错误上传类型、缺失 report、缺失 application 和错误 import version 的状态码与 `detail`。其中错误 import 还会验证已有 report 仍然能读取，避免坏导入破坏本地数据。

### 你怎么保证本地数据导入导出可靠？

我加了 `scripts/check-data-integrity.ps1`。它会创建 report、导出、删除、恢复，再校验 ID、score、summary 一致。之后它会重复导入同 ID report，要求 `imported=0`、`skipped=1`，并确认本地已有 report 没被覆盖。这说明 JSON backup/restore 可以重复执行，不会误覆盖用户本地数据。

### 你怎么考虑前端可访问性？

我做了一层基础 accessibility wiring：输入区有 label / helper 关联，切换按钮有 `aria-pressed`，报告 tabs 有 `tablist` / `tab` / `aria-selected` / `tabpanel`，状态变化用 `aria-live`，导入 JSON 不再只依赖隐藏 file input，而是用可聚焦按钮触发。`scripts/check-accessibility.ps1` 会把这些语义点纳入 smoke。

### 为什么做 resume version matrix？

因为真实求职不是只分析一次简历，而是不断改版本。matrix 可以把“改得更好了没有”量化出来：同一 JD 下看 score delta、gained skills、remaining gaps 和 best version。它不生成虚假经历，只比较用户输入的不同简历证据。

### 如果继续做，你会怎么扩展？

我会优先做三件事：

1. 加 exporter preview，让用户导出前预览 Markdown。
2. 扩展 evaluation fixtures，覆盖更多岗位和边界输入。
3. 加多岗位对比，但仍保持 SQLite 和 Docker-first，不急着上重型服务。

## 16. 不要夸大的边界

面试时不要说：

- 它能预测录用概率。
- 它能保证 ATS 通过。
- 它是企业级安全系统。
- 它是完整 SaaS。
- 它是本地大模型项目。
- 它是重型向量数据库 RAG 平台。
- 它已经通过完整 WCAG 认证。
- 它能自动证明定制版简历一定带来面试机会。

应该说：

```text
这是一个本地优先、可解释、可验证的单用户 AI 求职工作流项目。
```

## 17. 现场演示顺序

```text
README top
-> Demo Evidence screenshots
-> docker compose ps
-> http://localhost:3000
-> AI app sample
-> Analyze Fit
-> Readiness
-> Action Board
-> Proof Plan
-> Interview
-> Export Portfolio Case Study
-> docs/privacy.md
-> .github/workflows/smoke.yml
-> docs/evaluation-fixtures.json
-> scripts/check-markdown-quality.ps1
-> docs/api-contract.md
-> scripts/check-data-integrity.ps1
-> scripts/check-negative-paths.ps1
-> scripts/check-accessibility.ps1
-> scripts/check-resume-matrix.ps1
```
