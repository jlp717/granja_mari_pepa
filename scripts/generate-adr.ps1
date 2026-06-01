<#
.SYNOPSIS
    Generate an Architecture Decision Record (ADR)
.DESCRIPTION
    Creates a new ADR file in docs/adr/ with sequential numbering.
    Called by @orchestrator when an architectural decision is made.
.PARAMETER Title
    The title of the decision
.PARAMETER Decision
    What was decided
.PARAMETER Context
    Why the decision was made
.PARAMETER Consequences
    Impact of the decision
.PARAMETER Alternatives
    Other options considered
.EXAMPLE
    .\generate-adr.ps1 -Title "Migrate to Tailwind v4" -Decision "Use @theme" -Context "v3 deprecated" -Consequences "CSS-first config"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$Title,
    [Parameter(Mandatory = $true)]
    [string]$Decision,
    [Parameter(Mandatory = $true)]
    [string]$Context,
    [Parameter(Mandatory = $false)]
    [string]$Consequences = "Pendiente de evaluar",
    [Parameter(Mandatory = $false)]
    [string]$Alternatives = "N/A",
    [Parameter(Mandatory = $false)]
    [string]$References = "N/A",
    [Parameter(Mandatory = $false)]
    [string]$Status = "Propuesta"
)

$adrDir = "docs\adr"
if (-not (Test-Path $adrDir)) {
    New-Item -ItemType Directory -Path $adrDir -Force | Out-Null
}

# Find next number
$existing = Get-ChildItem "$adrDir\*.md" | Where-Object { $_ -match '(\d{4})-' } | ForEach-Object { [int]$Matches[1] }
$nextNum = if ($existing) { ($existing | Sort-Object -Descending | Select-Object -First 1) + 1 } else { 1 }
$numStr = $nextNum.ToString("0000")

# Create safe filename
$safeTitle = ($Title -replace '[^\w\s-]', '' -replace '\s+', '-' -replace '-+', '-').ToLower()
$filename = "$adrDir\$numStr-$safeTitle.md"

$content = @"
# ADR-$numStr: $Title

## Estado
$Status

## Contexto
$Context

## Decisión
$Decision

## Consecuencias
$Consequences

## Alternativas Consideradas
$Alternatives

## Referencias
$References

---
*Generado por @orchestrator el $(Get-Date -Format 'yyyy-MM-dd')*
"@

$content | Out-File -FilePath $filename -Encoding UTF8
Write-Host "✅ ADR created: $filename" -ForegroundColor Green
return $filename
