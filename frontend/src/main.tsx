import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  analyzeFit,
  createApplication,
  exportReports,
  fetchApplications,
  fetchReport,
  fetchReports,
  importReports,
  parseResumeFile,
  removeReport,
  runMatrix,
  updateApplicationStatus,
} from "./api";
import {
  ComparePanel,
  DemoNotice,
  EmptyReport,
  FastActionPanels,
  MiniPanel,
  ResumeMatrixPanel,
  TrackerPanel,
} from "./components";
import {
  toInterviewPackMarkdown,
  toMarkdown,
  toPortfolioCaseStudyMarkdown,
} from "./exportMarkdown";
import { buildApplicationPayload, emptyApplicationDraft } from "./applicationTracker";
import { normalizeJobSource } from "./jobSource";
import { buildMarkdownFilename, downloadJsonFile, downloadMarkdownFile } from "./markdownDownloads";
import { appendCompareReport, clearDeletedReport, isCompareReportSelected, removeCompareReport } from "./reportHistory";
import { normalizeReport } from "./reportNormalization";
import { ReportView } from "./reportView";
import type {
  ActionCopy,
  ApplicationItem,
  AnalysisReport,
  Copy,
  InterviewCopy,
  Language,
  PortfolioCopy,
  ReadinessCopy,
  ReportListItem,
  ReportsExport,
  ReportsImportResult,
  ResumeMatrixReport,
  Tab,
} from "./types";
import "./styles.css";

const copy: Record<Language, Omit<Copy, keyof InterviewCopy | keyof ReadinessCopy | keyof ActionCopy | keyof PortfolioCopy | "tabs"> & { tabs: Omit<Record<Tab, string>, "proof" | "readiness" | "action"> } & Partial<InterviewCopy>> = {
  en: {
    eyebrow: "Local-first AI Job-fit Tool",
    heroCopy:
      "Compare a resume against a job description, expose skill gaps, and export an evidence-backed improvement report.",
    runtime: "Runtime",
    runtimeMode: "Docker Compose or local dev",
    model: "Model",
    localFirst: "Local-first",
    privacy: "Local data, optional API, no secrets committed",
    resume: "Resume",
    resumeHelp: "Paste text or upload PDF/TXT/MD",
    jd: "Job Description",
    jobSourceTitle: "Job source",
    jobCompany: "Company",
    jobRole: "Role",
    jobSourceUrl: "Source URL",
    jobCapturedAt: "Captured date",
    jobSourceHelp: "Paste public JD text below. Use source fields for your own reference; do not scrape login-only pages.",
    analyze: "Analyze Fit",
    analyzing: "Analyzing...",
    exportMarkdown: "Export Markdown",
    exportInterviewPack: "Export Interview Pack",
    exportJson: "Export JSON",
    importJson: "Import JSON",
    loadFrontend: "Frontend sample",
    loadAi: "AI app sample",
    demoMode: "Demo mode",
    editMode: "Edit mode",
    clear: "Clear",
    history: "Report History",
    refresh: "Refresh",
    delete: "Delete",
    select: "Select",
    selected: "Selected",
    open: "Open",
    noHistory: "No saved reports yet.",
    demoTitle: "Portfolio Demo",
    demoBody: "Read-only walkthrough for interviews: inputs, score, gaps, learning plan, and export-ready report.",
    compareTitle: "Report Compare",
    compareHint: "Select two history items to compare role fit and gaps.",
    matrixTitle: "Resume Version Matrix",
    matrixHint: "Compare the current resume with a second version against the same JD.",
    matrixBaseline: "Baseline resume",
    matrixTailored: "Tailored resume version",
    runMatrix: "Compare versions",
    matrixBest: "Best version",
    trackerTitle: "Application Tracker",
    company: "Company",
    role: "Role",
    status: "Status",
    nextAction: "Next action",
    addTarget: "Add target",
    markApplied: "Mark applied",
    noApplications: "No tracked applications yet.",
    evidenceQuality: "Evidence quality",
    qualityScore: "Quality score",
    scoreDelta: "Score delta",
    gainedSkills: "Gained skills",
    remainingGaps: "Remaining gaps",
    overallMatch: "Overall Match",
    reportId: "Report ID",
    matchedSkills: "Matched Skills",
    missingSkills: "Missing Skills",
    jdRequirements: "JD Requirements",
    evidence: "Evidence",
    evidenceTrace: "Evidence Trace",
    traceStatus: "Status",
    resumeEvidence: "Resume evidence",
    jdEvidence: "JD evidence",
    gapReason: "Gap reason",
    recommendation: "Recommendation",
    resumeSuggestions: "Resume Suggestions",
    optimizedBullets: "Optimized Bullets",
    tailoredResume: "Tailored Resume Draft",
    tailoredSummary: "Tailored Summary",
    integrityNote: "Integrity Note",
    caseStudy: "Case Study",
    problem: "Problem",
    solution: "Solution",
    architecture: "Architecture",
    tradeoffs: "Trade-offs",
    demoTalkTrack: "Demo Talk Track",
    interviewQuestions: "Interview Questions",
    interviewPack: "Interview Pack",
    positioningStatement: "Positioning Statement",
    starAnswers: "STAR Answers",
    riskNotes: "Risk Notes",
    closePitch: "Close Pitch",
    situation: "Situation",
    task: "Task",
    result: "Result",
    structure: "Structure",
    learningPlan: "7-Day Learning Plan",
    bulletRubric: "Bullet Rubric",
    day: "Day",
    action: "Action",
    deliverable: "Deliverable",
    bulletScore: "Bullet Score",
    hasAction: "Action",
    hasTechnology: "Technology",
    hasResult: "Result",
    hasMetric: "Metric",
    suggestion: "Suggestion",
    scoreBreakdown: "Score Breakdown",
    keywordScore: "Keyword",
    semanticScore: "Semantic",
    structureScore: "Structure",
    apiMode: "API Mode",
    localFallback: "Local fallback",
    apiEnabled: "API refinement enabled",
    apiFailed: "API failed, fallback used",
    disclaimerTitle: "Disclaimer",
    disclaimer:
      "This is a job-fit guidance score, not a real ATS guarantee or hiring prediction. Use recommendations as review support.",
    emptyTitle: "Paste a resume and JD to generate the first report.",
    emptyBody:
      "The app works without API keys. Add OpenAI-compatible env vars only when you want chat and embedding refinement.",
    noItems: "None detected.",
    fastActionsTitle: "Fast Actions",
    prioritySprintTitle: "Priority Sprint",
    prioritySprintHint: "Top actions to improve this match fastest.",
    riskRadarTitle: "Interview Risk Radar",
    riskRadarHint: "Weak or missing proof to prepare before applying.",
    workflowTitle: "Workflow",
    workflowSteps: ["Paste resume", "Paste JD", "Analyze gaps", "Export report"],
    detailTitle: "Runtime Details",
    detailItems: ["Docker Compose or local dev", "SQLite local data", "PDF/TXT/MD parsing"],
    resumePlaceholder: "Paste resume text...",
    jdPlaceholder: "Paste target JD...",
    generated: "Generated",
    score: "Score",
    resumeSource: "Resume",
    jdSource: "JD",
    detected: "Detected",
    missing: "Missing",
    importSuccess: "Import complete",
    errorPrefix: "Analysis failed",
    tabs: {
      overview: "Overview",
      skills: "Skills",
      evidence: "Evidence",
      trace: "Trace",
      rewrite: "Rewrite",
      tailored: "Tailored",
      case: "Case",
      interview: "Interview",
      structure: "Structure",
      learning: "Learning",
      bullets: "Bullets",
    },
  },
  zh: {
    "eyebrow": "本地优先 AI 求职工具",
    "heroCopy": "对比简历和岗位 JD，找出技能差距，生成带证据的求职优化报告。",
    "runtime": "运行方式",
    "runtimeMode": "Docker Compose 或本地开发",
    "model": "模型",
    "localFirst": "本地优先",
    "privacy": "本地数据，可选 API，不提交密钥",
    "resume": "简历",
    "resumeHelp": "粘贴文本或上传 PDF/TXT/MD",
    "jd": "岗位 JD",
    "jobSourceTitle": "岗位来源",
    "jobCompany": "公司",
    "jobRole": "岗位",
    "jobSourceUrl": "来源 URL",
    "jobCapturedAt": "采集日期",
    "jobSourceHelp": "下面粘贴公开 JD 文本。来源字段只作本地记录；不要爬取需要登录的页面。",
    "analyze": "开始分析",
    "analyzing": "分析中...",
    "exportMarkdown": "导出 Markdown",
    "exportJson": "导出 JSON",
    "importJson": "导入 JSON",
    "loadFrontend": "前端样例",
    "loadAi": "AI 应用样例",
    "demoMode": "展示模式",
    "editMode": "编辑模式",
    "clear": "清空",
    "history": "报告历史",
    "refresh": "刷新",
    "delete": "删除",
    "select": "选择",
    "selected": "已选择",
    "open": "打开",
    "noHistory": "还没有保存的报告。",
    "demoTitle": "作品集展示",
    "demoBody": "只读演示视图：适合面试时展示输入、分数、缺口、学习计划和可导出报告。",
    "compareTitle": "报告对比",
    "compareHint": "从历史记录选择两份报告，对比岗位匹配和缺口变化。",
    "matrixTitle": "简历版本矩阵",
    "matrixHint": "用同一份 JD 对比当前简历和第二版简历。",
    "matrixBaseline": "基础版简历",
    "matrixTailored": "定制版简历",
    "runMatrix": "对比版本",
    "matrixBest": "最佳版本",
    "trackerTitle": "投递追踪",
    "company": "公司",
    "role": "岗位",
    "status": "状态",
    "nextAction": "下一步",
    "addTarget": "加入目标",
    "markApplied": "标记已投递",
    "noApplications": "暂无追踪岗位。",
    "evidenceQuality": "证据质量",
    "qualityScore": "质量分",
    "scoreDelta": "分数变化",
    "gainedSkills": "新增命中",
    "remainingGaps": "仍需补强",
    "overallMatch": "总体匹配",
    "reportId": "报告 ID",
    "matchedSkills": "已匹配技能",
    "missingSkills": "缺失技能",
    "jdRequirements": "JD 要求",
    "evidence": "证据",
    "evidenceTrace": "证据链",
    "traceStatus": "状态",
    "resumeEvidence": "简历证据",
    "jdEvidence": "JD 证据",
    "gapReason": "缺口原因",
    "recommendation": "建议动作",
    "resumeSuggestions": "简历优化建议",
    "optimizedBullets": "简历 Bullet",
    "tailoredResume": "定制简历草稿",
    "tailoredSummary": "定制 Summary",
    "integrityNote": "真实性说明",
    "caseStudy": "项目案例",
    "problem": "问题",
    "solution": "方案",
    "architecture": "架构",
    "tradeoffs": "取舍",
    "demoTalkTrack": "演示话术",
    "interviewQuestions": "面试追问",
    "structure": "结构",
    "learningPlan": "7 天学习计划",
    "bulletRubric": "Bullet 评分",
    "day": "第几天",
    "action": "行动",
    "deliverable": "交付物",
    "bulletScore": "Bullet 分数",
    "hasAction": "动作",
    "hasTechnology": "技术",
    "hasResult": "结果",
    "hasMetric": "指标",
    "suggestion": "建议",
    "scoreBreakdown": "分数拆解",
    "keywordScore": "关键词",
    "semanticScore": "语义",
    "structureScore": "结构",
    "apiMode": "API 模式",
    "localFallback": "本地 fallback",
    "apiEnabled": "API 增强已启用",
    "apiFailed": "API 失败，已 fallback",
    "disclaimerTitle": "免责声明",
    "disclaimer": "这是求职匹配参考分，不是真实 ATS 保证，也不代表录用概率。建议仅作为修改辅助。",
    "emptyTitle": "粘贴简历和 JD 后生成第一份报告。",
    "emptyBody": "默认不需要 API key。填写 OpenAI-compatible 环境变量后，可启用 chat 和 embedding 增强。",
    "noItems": "暂无识别结果。",
    "fastActionsTitle": "快速行动",
    "prioritySprintTitle": "优先冲刺",
    "prioritySprintHint": "最快提升匹配度的前三个动作。",
    "riskRadarTitle": "面试风险雷达",
    "riskRadarHint": "投递前需要准备的弱证据或缺失证据。",
    "workflowTitle": "流程",
    "workflowSteps": [
      "粘贴简历",
      "粘贴 JD",
      "分析差距",
      "导出报告"
    ],
    "detailTitle": "运行细节",
    "detailItems": [
      "Docker Compose 或本地开发",
      "SQLite 本地数据",
      "PDF/TXT/MD 解析"
    ],
    "resumePlaceholder": "粘贴简历文本...",
    "jdPlaceholder": "粘贴目标岗位 JD...",
    "generated": "生成时间",
    "score": "分数",
    "resumeSource": "简历",
    "jdSource": "JD",
    "detected": "已检测",
    "missing": "缺失",
    "importSuccess": "导入完成",
    "errorPrefix": "分析失败",
    "tabs": {
      "overview": "总览",
      "skills": "技能",
      "evidence": "证据",
      "trace": "证据链",
      "rewrite": "改写",
      "tailored": "定制",
      "case": "案例",
      "interview": "面试",
      "structure": "结构",
      "learning": "学习",
      "bullets": "Bullet"
    }
  },
};

const interviewCopy: Record<Language, InterviewCopy> = {
  en: {
    exportInterviewPack: "Export Interview Pack",
    interviewPack: "Interview Pack",
    positioningStatement: "Positioning Statement",
    starAnswers: "STAR Answers",
    riskNotes: "Risk Notes",
    closePitch: "Close Pitch",
    situation: "Situation",
    task: "Task",
    result: "Result",
    proofPlan: "Proof Plan",
    riskLevel: "Risk level",
    proofArtifact: "Proof artifact",
    smallTask: "Small task",
    acceptanceCheck: "Acceptance check",
    estimatedDays: "Estimated days",
  },
  zh: {
    "exportInterviewPack": "导出面试包",
    "interviewPack": "面试包",
    "positioningStatement": "定位陈述",
    "starAnswers": "STAR 答案",
    "riskNotes": "风险提示",
    "closePitch": "收尾 Pitch",
    "situation": "Situation",
    "task": "Task",
    "result": "Result",
    "proofPlan": "证明计划",
    "riskLevel": "风险等级",
    "proofArtifact": "证明材料",
    "smallTask": "小任务",
    "acceptanceCheck": "验收检查",
    "estimatedDays": "预计天数"
  },
};

const readinessCopy: Record<Language, ReadinessCopy> = {
  en: {
    readiness: "Readiness",
    readinessLevel: "Readiness level",
    strengths: "Strengths",
    blockers: "Blockers",
    nextBestAction: "Next best action",
  },
  zh: {
    "readiness": "准备度",
    "readinessLevel": "准备等级",
    "strengths": "优势",
    "blockers": "阻碍",
    "nextBestAction": "下一步最佳行动"
  },
};

const actionCopy: Record<Language, ActionCopy> = {
  en: {
    actionBoard: "Action Board",
    priority: "Priority",
    source: "Source",
    skill: "Skill",
  },
  zh: {
    "actionBoard": "行动看板",
    "priority": "优先级",
    "source": "来源",
    "skill": "技能"
  },
};

const portfolioCopy: Record<Language, PortfolioCopy> = {
  en: {
    exportPortfolioCaseStudy: "Export Portfolio Case Study",
    headline: "Headline",
    proofArtifacts: "Proof artifacts",
    nextActions: "Next actions",
    resumeBullet: "Resume bullet",
  },
  zh: {
    "exportPortfolioCaseStudy": "导出作品集案例",
    "headline": "标题",
    "proofArtifacts": "证明材料",
    "nextActions": "下一步行动",
    "resumeBullet": "简历 Bullet"
  },
};

function getCopy(language: Language): Copy {
  const { overview, ...remainingTabs } = copy[language].tabs;
  return {
    ...copy[language],
    ...interviewCopy[language],
    ...readinessCopy[language],
    ...actionCopy[language],
    ...portfolioCopy[language],
    tabs: {
      overview,
      readiness: readinessCopy[language].readiness,
      action: actionCopy[language].actionBoard,
      ...remainingTabs,
      proof: interviewCopy[language].proofPlan,
    },
  };
}

const LANGUAGE_KEY = "jobfit-language";

const samples = {
  frontend: {
    resume: `Jane Doe jane@example.com

Summary
Frontend developer focused on React and TypeScript dashboards.

Skills
React, TypeScript, Docker, REST API, SQLite, testing

Experience
Built a local-first dashboard that reduced manual weekly reporting time by 35%.`,
    matrixResume: `Jane Doe jane@example.com

Summary
Frontend developer focused on React, TypeScript, product dashboards, and testable UI workflows.

Skills
React, TypeScript, Docker, REST API, SQLite, testing, product thinking

Experience
Built a local-first dashboard with REST API integration, Docker delivery, and focused UI tests that reduced manual weekly reporting time by 35%.`,
    jd: `Frontend Engineer role requiring React, TypeScript, REST API integration, testing, Docker, product thinking, and clear UI implementation evidence.`,
    company: "Example Studio",
    role: "Frontend Engineer",
    sourceUrl: "https://example.com/jobs/frontend-engineer",
    capturedAt: "2026-06-08",
  },
  ai: {
    resume: `Jane Doe jane@example.com

Summary
AI application developer building local-first tools.

Skills
React, TypeScript, FastAPI, Docker, SQLite, RAG, embeddings

Projects
Built a Dockerized resume/JD analyzer using FastAPI, React, evidence matching, and Markdown export for 2-minute job-fit reviews.`,
    matrixResume: `Jane Doe jane@example.com

Summary
AI application developer building local-first RAG tools with measurable product impact.

Skills
React, TypeScript, FastAPI, Docker, SQLite, SQL, RAG, embeddings, vector search, testing

Projects
Built a Dockerized resume/JD analyzer using FastAPI, React, SQL persistence, evidence matching, fixture evaluation, and Markdown export for 2-minute job-fit reviews.`,
    jd: `AI Application Developer role requires React, TypeScript, FastAPI, Docker, RAG, embeddings, vector search, SQL, testing, and measurable product impact.`,
    company: "Example AI Lab",
    role: "AI Application Developer",
    sourceUrl: "https://example.com/jobs/ai-application-developer",
    capturedAt: "2026-06-08",
  },
};

function App() {
  const [language, setLanguage] = useState<Language>(() => {
    return localStorage.getItem(LANGUAGE_KEY) === "zh" ? "zh" : "en";
  });
  const [resumeText, setResumeText] = useState(samples.ai.resume);
  const [jdText, setJdText] = useState(samples.ai.jd);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<ReportListItem[]>([]);
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [jobCompany, setJobCompany] = useState(samples.ai.company);
  const [jobRole, setJobRole] = useState(samples.ai.role);
  const [jobSourceUrl, setJobSourceUrl] = useState(samples.ai.sourceUrl);
  const [jobCapturedAt, setJobCapturedAt] = useState(samples.ai.capturedAt);
  const [matrixResumeText, setMatrixResumeText] = useState(samples.ai.matrixResume);
  const [matrixReport, setMatrixReport] = useState<ResumeMatrixReport | null>(null);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [compareReports, setCompareReports] = useState<AnalysisReport[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const t = getCopy(language);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    void loadHistory();
    void loadApplications();
  }, []);

  const jobSource = useMemo(
    () => normalizeJobSource({
      company: jobCompany,
      role: jobRole,
      sourceUrl: jobSourceUrl,
      capturedAt: jobCapturedAt,
    }),
    [jobCapturedAt, jobCompany, jobRole, jobSourceUrl],
  );
  const markdown = useMemo(() => (report ? toMarkdown(report, t, compareReports, jobSource) : ""), [report, t, compareReports, jobSource]);
  const interviewMarkdown = useMemo(() => (report ? toInterviewPackMarkdown(report, t, applications, jobSource) : ""), [report, t, applications, jobSource]);
  const portfolioMarkdown = useMemo(() => (report ? toPortfolioCaseStudyMarkdown(report, t, jobSource) : ""), [report, t, jobSource]);
  const canAnalyze = resumeText.trim().length >= 20 && jdText.trim().length >= 20 && !loading;
  const canRunMatrix = resumeText.trim().length >= 20 && matrixResumeText.trim().length >= 20 && jdText.trim().length >= 20 && !matrixLoading;

  async function analyze() {
    setLoading(true);
    setError("");
    try {
      const nextReport = await analyzeFit(resumeText, jdText);
      setReport(normalizeReport(nextReport));
      setActiveTab("overview");
      await loadHistory();
    } catch (err) {
      setError(`${t.errorPrefix}: ${err instanceof Error ? err.message : t.errorPrefix}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const nextHistory = await fetchReports();
      setHistory(nextHistory);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function runResumeMatrix() {
    setMatrixLoading(true);
    setError("");
    try {
      setMatrixReport(await runMatrix(jdText, resumeText, matrixResumeText));
    } catch (err) {
      setError(`${t.errorPrefix}: ${err instanceof Error ? err.message : t.errorPrefix}`);
    } finally {
      setMatrixLoading(false);
    }
  }

  async function loadApplications() {
    try {
      setApplications(await fetchApplications());
    } catch {
      return;
    }
  }

  async function addApplication() {
    const payload = buildApplicationPayload({ company, role, nextAction }, report?.id);
    if (!payload) return;
    try {
      await createApplication(payload);
    } catch {
      return;
    }
    const emptyDraft = emptyApplicationDraft();
    setCompany(emptyDraft.company);
    setRole(emptyDraft.role);
    setNextAction(emptyDraft.nextAction);
    await loadApplications();
  }

  async function markApplied(item: ApplicationItem) {
    try {
      await updateApplicationStatus(item);
      await loadApplications();
    } catch {
      return;
    }
  }

  async function openReport(id: string) {
    try {
      setReport(normalizeReport(await fetchReport(id)));
      setActiveTab("overview");
    } catch {
      return;
    }
  }

  async function deleteReport(item: ReportListItem) {
    if (!window.confirm(`${t.delete} ${item.summary}?`)) return;
    try {
      await removeReport(item.id);
    } catch {
      return;
    }
    setReport(clearDeletedReport(report, item));
    await loadHistory();
  }

  async function toggleCompare(id: string) {
    if (isCompareReportSelected(compareReports, id)) {
      setCompareReports(removeCompareReport(compareReports, id));
      return;
    }
    try {
      const next = normalizeReport(await fetchReport(id));
      setCompareReports(appendCompareReport(compareReports, next));
    } catch {
      return;
    }
  }

  function downloadMarkdown() {
    if (!markdown) return;
    downloadMarkdownFile(markdown, buildMarkdownFilename("report", language, report?.id));
  }

  function downloadInterviewPack() {
    if (!interviewMarkdown) return;
    downloadMarkdownFile(interviewMarkdown, buildMarkdownFilename("interview-pack", language, report?.id));
  }

  function downloadPortfolioCaseStudy() {
    if (!portfolioMarkdown) return;
    downloadMarkdownFile(portfolioMarkdown, buildMarkdownFilename("portfolio-case-study", language, report?.id));
  }

  async function downloadReportsJson() {
    let payload: string;
    try {
      payload = await exportReports();
    } catch {
      return;
    }
    downloadJsonFile(payload, `jobfit-reports-${new Date().toISOString().slice(0, 10)}.json`);
  }

  async function importReportsJson(file: File | null) {
    if (!file) return;
    setError("");
    setStatusMessage("");
    try {
      const payload = JSON.parse(await file.text()) as ReportsExport;
      const result = await importReports(payload);
      setStatusMessage(`${t.importSuccess}: ${result.imported} imported, ${result.skipped} skipped`);
      await loadHistory();
    } catch (err) {
      setError(`${t.errorPrefix}: ${err instanceof Error ? err.message : t.errorPrefix}`);
    }
  }

  async function loadResumeFile(file: File | null) {
    if (!file) return;
    try {
      const parsed = await parseResumeFile(file);
      setResumeText(parsed.text);
    } catch (err) {
      setError(`${t.errorPrefix}: ${err instanceof Error ? err.message : t.errorPrefix}`);
    }
  }

  function loadSample(name: keyof typeof samples) {
    setResumeText(samples[name].resume);
    setMatrixResumeText(samples[name].matrixResume);
    setJdText(samples[name].jd);
    setJobCompany(samples[name].company);
    setJobRole(samples[name].role);
    setJobSourceUrl(samples[name].sourceUrl);
    setJobCapturedAt(samples[name].capturedAt);
    setReport(null);
    setMatrixReport(null);
  }

  function clearInputs() {
    setResumeText("");
    setMatrixResumeText("");
    setJdText("");
    setJobCompany("");
    setJobRole("");
    setJobSourceUrl("");
    setJobCapturedAt("");
    setReport(null);
    setMatrixReport(null);
    setError("");
  }

  return (
    <main className="app-shell" lang={language === "zh" ? "zh-CN" : "en"}>
      <section className="hero">
        <div>
          <div className="top-row">
            <p className="eyebrow">{t.eyebrow}</p>
            <div className="language-switch" aria-label="Language switcher">
              <button aria-pressed={language === "en"} className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")} type="button">
                EN
              </button>
              <button aria-pressed={language === "zh"} className={language === "zh" ? "active" : ""} onClick={() => setLanguage("zh")} type="button">
                中文
              </button>
            </div>
          </div>
          <h1>JobFit RAG</h1>
          <p className="hero-copy">{t.heroCopy}</p>
        </div>
        <div className="status-panel">
          <span>{t.runtime}</span>
          <strong>{t.runtimeMode}</strong>
          <span>{t.model}</span>
          <strong>API-based, no local LLM</strong>
          <span>{t.localFirst}</span>
          <strong>{t.privacy}</strong>
        </div>
      </section>

      <section className="mini-grid">
        <MiniPanel title={t.workflowTitle} items={t.workflowSteps} />
        <MiniPanel title={t.detailTitle} items={t.detailItems} />
      </section>

      <section className="workspace">
        <div className="sample-row">
          <button aria-pressed={demoMode} className={demoMode ? "secondary active-mode" : "secondary"} onClick={() => setDemoMode(!demoMode)} type="button">
            {demoMode ? t.editMode : t.demoMode}
          </button>
          <button className="secondary" onClick={() => loadSample("frontend")} type="button">
            {t.loadFrontend}
          </button>
          <button className="secondary" onClick={() => loadSample("ai")} type="button">
            {t.loadAi}
          </button>
          <button className="ghost" onClick={clearInputs} type="button">
            {t.clear}
          </button>
        </div>
        {demoMode ? <DemoNotice t={t} /> : null}
        <section className="job-source-panel" aria-labelledby="job-source-title">
          <div>
            <h2 id="job-source-title">{t.jobSourceTitle}</h2>
            <p className="muted" id="job-source-help">{t.jobSourceHelp}</p>
          </div>
          <div className="job-source-grid" aria-describedby="job-source-help">
            <label className="field" htmlFor="job-company">
              <span>{t.jobCompany}</span>
              <input id="job-company" value={jobCompany} readOnly={demoMode} onChange={(event) => setJobCompany(event.target.value)} />
            </label>
            <label className="field" htmlFor="job-role">
              <span>{t.jobRole}</span>
              <input id="job-role" value={jobRole} readOnly={demoMode} onChange={(event) => setJobRole(event.target.value)} />
            </label>
            <label className="field" htmlFor="job-source-url">
              <span>{t.jobSourceUrl}</span>
              <input id="job-source-url" type="url" value={jobSourceUrl} readOnly={demoMode} onChange={(event) => setJobSourceUrl(event.target.value)} />
            </label>
            <label className="field" htmlFor="job-captured-at">
              <span>{t.jobCapturedAt}</span>
              <input id="job-captured-at" type="date" value={jobCapturedAt} readOnly={demoMode} onChange={(event) => setJobCapturedAt(event.target.value)} />
            </label>
          </div>
        </section>
        <div className={demoMode ? "input-grid demo-readonly" : "input-grid"}>
          <label className="field">
            <span>{t.resume}</span>
            <small id="resume-help">{t.resumeHelp}</small>
            {!demoMode ? (
              <input
                aria-label={t.resumeHelp}
                className="file-input"
                type="file"
                accept=".pdf,.txt,.md,.markdown,.text"
                onChange={(event) => loadResumeFile(event.target.files?.[0] ?? null)}
              />
            ) : null}
            <textarea id="resume-text" aria-describedby="resume-help" value={resumeText} readOnly={demoMode} onChange={(event) => setResumeText(event.target.value)} placeholder={t.resumePlaceholder} />
          </label>
          <label className="field">
            <span>{t.jd}</span>
            <small id="jd-help">{`${jdText.trim().length} chars`}</small>
            <textarea id="jd-text" aria-describedby="jd-help" value={jdText} readOnly={demoMode} onChange={(event) => setJdText(event.target.value)} placeholder={t.jdPlaceholder} />
          </label>
        </div>
        <div className="actions" aria-live="polite">
          <button onClick={analyze} disabled={!canAnalyze}>
            {loading ? t.analyzing : t.analyze}
          </button>
          <button className="secondary" onClick={downloadMarkdown} disabled={!report}>
            {t.exportMarkdown}
          </button>
          <button className="secondary" onClick={downloadInterviewPack} disabled={!report}>
            {t.exportInterviewPack}
          </button>
          <button className="secondary" onClick={downloadPortfolioCaseStudy} disabled={!report}>
            {t.exportPortfolioCaseStudy}
          </button>
          <button className="secondary" onClick={downloadReportsJson} type="button">
            {t.exportJson}
          </button>
          <button className="import-button" onClick={() => importInputRef.current?.click()} type="button">
            {t.importJson}
          </button>
          <input
            ref={importInputRef}
            aria-label={t.importJson}
            className="visually-hidden"
            type="file"
            accept=".json,application/json"
            onChange={(event) => {
              void importReportsJson(event.target.files?.[0] ?? null);
              event.currentTarget.value = "";
            }}
          />
        </div>
        {statusMessage ? <p aria-live="polite">{statusMessage}</p> : null}
        {error ? <p className="error" aria-live="polite">{error}</p> : null}
      </section>

      <section className="content-grid">
        <aside className="history-panel">
          <div className="panel-header">
            <h2>{t.history}</h2>
            <button className="ghost" onClick={loadHistory} type="button">
              {historyLoading ? "..." : t.refresh}
            </button>
          </div>
          {history.length ? (
            <ul className="history-list">
              {history.map((item) => (
                <li key={item.id}>
                  <button className="history-main" onClick={() => openReport(item.id)} type="button">
                    <strong>{item.overall_score}/100</strong>
                    <span>{item.summary}</span>
                  </button>
                  <button className="ghost compact" onClick={() => toggleCompare(item.id)} type="button">
                    {isCompareReportSelected(compareReports, item.id) ? t.selected : t.select}
                  </button>
                  <button
                    aria-label={`${t.delete} ${item.summary}`}
                    className="text-danger"
                    onClick={() => deleteReport(item)}
                    type="button"
                  >
                    {t.delete}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">{t.noHistory}</p>
          )}
        </aside>
        <div>
          <TrackerPanel
            applications={applications}
            company={company}
            role={role}
            nextAction={nextAction}
            setCompany={setCompany}
            setRole={setRole}
            setNextAction={setNextAction}
            addApplication={addApplication}
            markApplied={markApplied}
            t={t}
          />
          <ResumeMatrixPanel
            matrixResumeText={matrixResumeText}
            setMatrixResumeText={setMatrixResumeText}
            runResumeMatrix={runResumeMatrix}
            canRunMatrix={canRunMatrix}
            matrixReport={matrixReport}
            matrixLoading={matrixLoading}
            t={t}
          />
          <ComparePanel reports={compareReports} t={t} />
          {report ? <FastActionPanels report={report} t={t} /> : null}
          {report ? <ReportView report={report} t={t} activeTab={activeTab} setActiveTab={setActiveTab} /> : <EmptyReport t={t} />}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
