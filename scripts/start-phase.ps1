<#
.SYNOPSIS
    Start a new phase: creates branch, updates tracker, generates ADR
.DESCRIPTION
    Automates the beginning of a development phase:
    1. Creates git branch
    2. Updates memory phase tracker
    3. Generates phase ADR
    4. Outputs next steps
.PARAMETER Phase
    Phase name (e.g., F0, F1, F2)
.PARAMETER Description
    Brief description of what this phase does
.EXAMPLE
    .\start-phase.ps1 -Phase "F2" -Description "Home + Header + Footer redesign"
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^F[0-6]$')]
    [string]$Phase,
    [Parameter(Mandatory = $true)]
    [string]$Description
)

$ErrorActionPreference = "Stop"

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   STARTING PHASE $Phase                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ─── 1. Verify git status ───
Write-Host "📌 Checking git status..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "  ⚠️  Uncommitted changes found. Commit or stash before starting a phase." -ForegroundColor Yellow
    git status --short
    $continue = Read-Host "  Continue anyway? (y/N)"
    if ($continue -ne "y") {
        Write-Host "❌ Phase start cancelled" -ForegroundColor Red
        exit 1
    }
}

# ─── 2. Create branch ───
$branchName = "redesign-2026/phase-$($Phase.ToLower())"
Write-Host "🌿 Creating branch: $branchName" -ForegroundColor Yellow
$existing = git branch --list $branchName
if ($existing) {
    Write-Host "  ⚠️  Branch already exists. Checking out..." -ForegroundColor Yellow
    git checkout $branchName 2>$null
} else {
    git checkout -b $branchName 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Branch created and checked out" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Could not create branch (may already exist)" -ForegroundColor Yellow
        git checkout $branchName 2>$null
    }
}

# ─── 3. Update phase tracker ───
Write-Host "📝 Updating phase tracker..." -ForegroundColor Yellow
$trackerFile = ".opencode\AGENTS.md"
if (Test-Path $trackerFile) {
    $content = Get-Content $trackerFile -Raw
    $pattern = "(\| $Phase \| ⬜ Pendiente \|)"
    $replacement = "| $Phase | 🟡 En progreso | redesign-2026/phase-$($Phase.ToLower()) | — | — |"
    if ($content -match $pattern) {
        $content = $content -replace $pattern, $replacement
        $content | Set-Content $trackerFile -Encoding UTF8
        Write-Host "  ✅ Phase tracker updated in AGENTS.md" -ForegroundColor Green
    }
}

# ─── 4. Generate ADR ───
Write-Host "📄 Generating phase ADR..." -ForegroundColor Yellow
$adrScript = "scripts\generate-adr.ps1"
if (Test-Path $adrScript) {
    $phaseInfo = @{
        "F0" = "Quick wins: i18n fixes, math corrections, cleanup"
        "F1" = "Visual system: tokens, fonts, Tailwind config, primitives"
        "F2" = "Home page: Header, HeroPinned, Footer, MobileMenu"
        "F3" = "Existing pages: /acerca, /contacto, /lorca, /area-clientes"
        "F4" = "New pages: /productos, /calidad-y-frio, /marcas"
        "F5" = "Motion: Lenis, reveals, stagger, cross-fade"
        "F6" = "QA: code review, Lighthouse, a11y, E2E tests"
    }
    
    $adrTitle = "Phase $Phase — $Description"
    $adrDecision = "Iniciar la fase $Phase del rediseño siguiendo REDESIGN_EXECUTION.md"
    $adrContext = "Completar la fase $Phase del plan de rediseño de granja_mari_pepa. $($phaseInfo[$Phase])"
    $adrCons = "Branch: $branchName. Los cambios deben pasar quality gates antes de mergear."
    
    & $adrScript -Title $adrTitle -Decision $adrDecision -Context $adrContext -Consequences $adrCons -Status "Aceptada"
}

# ─── 5. Summary ───
Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   PHASE $Phase STARTED                         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  📂 Branch: $branchName" -ForegroundColor White
Write-Host "  📋 Description: $Description" -ForegroundColor White
Write-Host "  📄 See: .opencode/REDESIGN_EXECUTION.md §$Phase" -ForegroundColor White
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor Yellow
Write-Host "  1. Implement the phase tasks" -ForegroundColor Gray
Write-Host "  2. Run quality gates: npm run typecheck && npm run lint && npm test" -ForegroundColor Gray
Write-Host "  3. Commit changes: git add . && git commit -m 'phase $Phase: ...'" -ForegroundColor Gray
Write-Host "  4. Push: git push origin $branchName" -ForegroundColor Gray
Write-Host "  5. Create PR: gh pr create" -ForegroundColor Gray
Write-Host ""
