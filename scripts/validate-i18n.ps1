<#
.SYNOPSIS
    Validates i18n translations across all locales
.DESCRIPTION
    Checks that all translation keys exist in all locale files.
    Detects missing keys, extra keys, and inconsistent values.
    Must pass before merging any phase.
.EXAMPLE
    .\validate-i18n.ps1
    Output: Report of missing/inconsistent translations
#>

$ErrorActionPreference = "Continue"
$messagesDir = "frontend\messages"
$exitCode = 0

if (-not (Test-Path $messagesDir)) {
    Write-Host "❌ Messages directory not found: $messagesDir" -ForegroundColor Red
    exit 1
}

$localeFiles = Get-ChildItem "$messagesDir\*.json" | Sort-Object Name
if ($localeFiles.Count -eq 0) {
    Write-Host "❌ No locale files found in $messagesDir" -ForegroundColor Red
    exit 1
}

Write-Host "🌐 Validating i18n translations..." -ForegroundColor Cyan
Write-Host "  Locales found: $($localeFiles.Count) ($($localeFiles.Name -join ', '))" -ForegroundColor Yellow

# Load all translations
$translations = @{}
foreach ($file in $localeFiles) {
    $locale = $file.BaseName
    $content = Get-Content $file.FullName -Raw | ConvertFrom-Json
    $translations[$locale] = $content
}

# Function to get all keys recursively
function Get-Keys {
    param($obj, $prefix = "")
    $keys = @()
    if ($obj -is [PSCustomObject]) {
        foreach ($prop in $obj.PSObject.Properties) {
            $key = if ($prefix) { "$prefix.$($prop.Name)" } else { $prop.Name }
            if ($prop.Value -is [PSCustomObject]) {
                $keys += Get-Keys $prop.Value $key
            } else {
                $keys += $key
            }
        }
    } elseif ($obj -is [Hashtable]) {
        foreach ($key in $obj.Keys) {
            $fullKey = if ($prefix) { "$prefix.$key" } else { $key }
            if ($obj[$key] -is [Hashtable] -or $obj[$key] -is [PSCustomObject]) {
                $keys += Get-Keys $obj[$key] $fullKey
            } else {
                $keys += $fullKey
            }
        }
    }
    return $keys
}

# Get all keys per locale
$localeKeys = @{}
foreach ($locale in $translations.Keys) {
    $localeKeys[$locale] = Get-Keys $translations[$locale]
}

# Find reference locale (es = Spanish, usually the most complete)
$referenceLocale = if ($localeKeys.ContainsKey("es")) { "es" } else { $localeKeys.Keys | Select-Object -First 1 }
$referenceKeys = $localeKeys[$referenceLocale]

Write-Host "  Reference locale: $referenceLocale ($($referenceKeys.Count) keys)" -ForegroundColor Yellow
Write-Host ""

$issuesFound = 0

foreach ($locale in $localeKeys.Keys) {
    if ($locale -eq $referenceLocale) { continue }
    
    $keys = $localeKeys[$locale]
    
    # Missing keys (in reference but not in this locale)
    $missing = $referenceKeys | Where-Object { $_ -notin $keys }
    if ($missing.Count -gt 0) {
        Write-Host "  ⚠️  $locale: $($missing.Count) missing keys" -ForegroundColor Yellow
        $missing | Select-Object -First 5 | ForEach-Object { Write-Host "      - $_" }
        if ($missing.Count -gt 5) {
            Write-Host "      ... and $($missing.Count - 5) more"
        }
        $issuesFound++
        $exitCode = 1
    }
    
    # Extra keys (in this locale but not in reference)
    $extra = $keys | Where-Object { $_ -notin $referenceKeys }
    if ($extra.Count -gt 0) {
        Write-Host "  ℹ️  $locale: $($extra.Count) extra keys (not in reference)" -ForegroundColor Gray
        $issuesFound++
    }
}

# Check for placeholder/AI-loop patterns in values
Write-Host ""
Write-Host "🔍 Scanning for AI-loop patterns in translations..." -ForegroundColor Cyan
$aiLoopPatterns = @(
    "equipo de expertos",
    "máxima calidad",
    "soluciones integrales",
    "experiencia premium",
    "excelencia",
    "transformación digital"
)

$aiLoopFound = $false
foreach ($locale in $translations.Keys) {
    $jsonContent = Get-Content "$messagesDir\$locale.json" -Raw
    foreach ($pattern in $aiLoopPatterns) {
        if ($jsonContent -match $pattern) {
            $context = $jsonContent -match "`"[^`"]*$pattern[^`"]*`""
            if ($matches) {
                $contextStr = $matches[0]
                Write-Host "  ⚠️  $locale: AI-loop pattern '$pattern' found in: $contextStr" -ForegroundColor Yellow
                $aiLoopFound = $true
                $exitCode = 1
            }
        }
    }
}

if (-not $aiLoopFound) {
    Write-Host "  ✅ No AI-loop patterns found in translations" -ForegroundColor Green
}

# Summary
Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ i18n validation PASSED — all locales complete and clean" -ForegroundColor Green
} else {
    Write-Host "⚠️  i18n validation found $issuesFound issues to review" -ForegroundColor Yellow
}

exit $exitCode
