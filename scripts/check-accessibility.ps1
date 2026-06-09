param(
  [string]$FrontendSource = "frontend/src/main.tsx",
  [string]$ComponentSource = "frontend/src/components.tsx",
  [string]$ReportViewSource = "frontend/src/reportView.tsx",
  [string]$Stylesheet = "frontend/src/styles.css"
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$mainPath = Join-Path $repo $FrontendSource
$componentPath = Join-Path $repo $ComponentSource
$reportViewPath = Join-Path $repo $ReportViewSource
$stylePath = Join-Path $repo $Stylesheet
$main = Get-Content -Raw -Encoding UTF8 $mainPath
$components = Get-Content -Raw -Encoding UTF8 $componentPath
$reportView = Get-Content -Raw -Encoding UTF8 $reportViewPath
$appSource = "$main`n$components`n$reportView"
$styles = Get-Content -Raw -Encoding UTF8 $stylePath

function Assert-Contains {
  param(
    [string]$Name,
    [string]$Text,
    [string]$Pattern
  )

  if ($Text -notmatch [regex]::Escape($Pattern)) {
    throw "$Name missing '$Pattern'"
  }
}

Write-Host "RUN  accessibility"

Assert-Contains "resume textarea id" $appSource 'id="resume-text"'
Assert-Contains "resume textarea help" $appSource 'aria-describedby="resume-help"'
Assert-Contains "jd textarea id" $appSource 'id="jd-text"'
Assert-Contains "jd textarea help" $appSource 'aria-describedby="jd-help"'
Assert-Contains "job source labelled section" $appSource 'aria-labelledby="job-source-title"'
Assert-Contains "job source helper" $appSource 'id="job-source-help"'
Assert-Contains "job company input" $appSource 'id="job-company"'
Assert-Contains "job role input" $appSource 'id="job-role"'
Assert-Contains "job source url input" $appSource 'id="job-source-url"'
Assert-Contains "job captured date input" $appSource 'id="job-captured-at"'
Assert-Contains "job captured date type" $appSource 'type="date"'
Assert-Contains "matrix textarea id" $appSource 'id="matrix-resume-text"'
Assert-Contains "resume upload label" $appSource 'aria-label={t.resumeHelp}'
Assert-Contains "language pressed state" $appSource 'aria-pressed={language === "en"}'
Assert-Contains "demo pressed state" $appSource 'aria-pressed={demoMode}'
Assert-Contains "status live region" $appSource 'aria-live="polite"'
Assert-Contains "tablist role" $appSource 'role="tablist"'
Assert-Contains "tab role" $appSource 'role="tab"'
Assert-Contains "tab selected state" $appSource 'aria-selected={activeTab === tab}'
Assert-Contains "tab id" $appSource 'id={tabId(tab)}'
Assert-Contains "tab controls" $appSource 'aria-controls={panelId(tab)}'
Assert-Contains "tab tabindex" $appSource 'tabIndex={activeTab === tab ? 0 : -1}'
Assert-Contains "tab keydown" $appSource 'onKeyDown={(event) => handleTabKeyDown(event, tab)}'
Assert-Contains "tabpanel role" $appSource 'role="tabpanel"'
Assert-Contains "tabpanel id" $appSource 'id={panelId(tab)}'
Assert-Contains "tabpanel labelledby" $appSource 'aria-labelledby={tabId(tab)}'
Assert-Contains "tabpanel hidden" $appSource 'hidden={activeTab !== tab}'
Assert-Contains "tabpanel tabindex" $appSource 'tabIndex={0}'
Assert-Contains "import input ref" $appSource 'importInputRef'
Assert-Contains "hidden import input" $appSource 'className="visually-hidden"'
Assert-Contains "delete report label" $appSource 'aria-label={`${t.delete} ${item.summary}`}'
Assert-Contains "tracker company label" $appSource 'aria-label={t.company}'
Assert-Contains "tracker role label" $appSource 'aria-label={t.role}'
Assert-Contains "tracker next action label" $appSource 'aria-label={t.nextAction}'
Assert-Contains "focus visible style" $styles ':focus-visible'
Assert-Contains "visually hidden style" $styles '.visually-hidden'

Write-Host "PASS accessibility"
