<#
.SYNOPSIS
    Renombra el sistema visual "Kage" a "GMP" en el arbol de trabajo.

.DESCRIPTION
    Por defecto NO modifica nada: informa de lo que haria (dry-run).
    Solo con -Apply ejecuta los cambios y pide confirmacion por Read-Host
    (salvo que se pase -Force).

    Fase 1: renombra directorios y archivos bajo frontend/ cuyo nombre contenga
            "kage" (sin distinguir mayusculas). Usa "git mv" si esta disponible
            y cae a Move-Item si git falla. Aborta si un destino ya existe.
    Fase 2: reemplaza texto en codigo, estilos, datos y docs del producto.
    Fase 3: informe de residuos y comprobacion de package.json / package-lock.json.

    Nunca toca reference/kage-verbatim/ (licencia y procedencia), caches,
    dependencias, binarios ni package-lock.json.

.PARAMETER Apply
    Ejecuta los cambios. Sin este switch el script es solo informativo.

.PARAMETER Force
    Con -Apply, omite la confirmacion interactiva y el guard de arbol limpio.

.EXAMPLE
    ./rename-kage-to-gmp.ps1
    Dry-run: lista renombrados, archivos que cambiarian y residuos actuales.

.EXAMPLE
    ./rename-kage-to-gmp.ps1 -Apply
    Aplica tras confirmar por consola.

.EXAMPLE
    ./rename-kage-to-gmp.ps1 -Apply -Force
    Aplica sin confirmacion (solo para ejecucion revisada y desatendida).

.NOTES
    Proyecto: Mari Pepa. No hay despliegue ni escritura en produccion.
    Rollback: git status / git diff, y restaurar desde git los cambios no deseados.
#>

[CmdletBinding()]
param(
    [switch]$Apply,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$Mode = if ($Apply) { '[APPLY]' } else { '[DRY-RUN]' }
$Root = Split-Path -Parent $PSScriptRoot
$Frontend = Join-Path $Root 'frontend'
$ScriptsDir = $PSScriptRoot
$SelfPath = if ($PSCommandPath) { $PSCommandPath } else { $MyInvocation.MyCommand.Path }
$ReadmeRenamePath = Join-Path $ScriptsDir 'README-RENAME-KAGE.md'

$TextExtensions = @(
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.scss',
    '.json', '.md', '.html', '.yml', '.yaml', '.txt', '.ps1'
)
$ExcludedDirNames = @(
    '.git', 'node_modules', 'reference', 'dist', 'build',
    'archivos_revisar', 'playwright-report', 'test-results'
)
$ExcludedDirPatterns = @('.next*', '.cache*')
$MaxTextBytes = 4194304

$VerbatimToken = '@@MPPROTECT-VERBATIM@@'
$ReferenceToken = '@@MPPROTECT-REFERENCE@@'
$RootDocMarkers = '(?i)(verbatim|reference/|licencia|autorizada|procedencia|literal de)'

$script:DocSkippedLines = 0

function Write-Info([string]$Message) {
    Write-Host "$Mode $Message"
}

function Write-Alert([string]$Message) {
    Write-Host "$Mode AVISO: $Message" -ForegroundColor Yellow
}

function Write-Fail([string]$Message) {
    Write-Host "$Mode ERROR: $Message" -ForegroundColor Red
}

Write-Info 'Renombrado Kage -> GMP'
Write-Info "Raiz del repositorio: $Root"

if (-not (Test-Path -LiteralPath $Frontend -PathType Container)) {
    Write-Fail "No existe la carpeta frontend/ en $Root. Ejecuta el script desde scripts/."
    exit 1
}

$GitAvailable = $null -ne (Get-Command git -ErrorAction SilentlyContinue)
if (-not $GitAvailable) {
    Write-Alert 'git no esta disponible: los renombrados usaran Move-Item.'
}

function Get-RelPath([string]$FullPath) {
    return $FullPath.Substring($Root.Length).TrimStart('\', '/')
}

function Test-ExcludedName([string]$Name) {
    if ($ExcludedDirNames -contains $Name) { return $true }
    foreach ($pattern in $ExcludedDirPatterns) {
        if ($Name -like $pattern) { return $true }
    }
    return $false
}

function Get-ChildItemsInto([string]$Directory, $Accumulator) {
    $entries = @()
    try {
        $entries = Get-ChildItem -LiteralPath $Directory -Force -ErrorAction Stop
    } catch {
        return
    }
    foreach ($entry in $entries) {
        if ($entry.PSIsContainer) {
            if (Test-ExcludedName $entry.Name) { continue }
            $Accumulator.Add($entry)
            Get-ChildItemsInto $entry.FullName $Accumulator
        } else {
            $Accumulator.Add($entry)
        }
    }
}

function Get-ChildItemsPruned([string]$Directory) {
    $results = New-Object System.Collections.Generic.List[object]
    Get-ChildItemsInto $Directory $results
    return $results
}

function Test-TextFile([System.IO.FileInfo]$File) {
    if ($File.Name -eq '.env.example') { return $true }
    if ($File.Name -eq 'package-lock.json') { return $false }
    if ($File.Name -match '(?i)\.min\.(js|mjs|cjs|css)$') { return $false }
    if ($TextExtensions -notcontains $File.Extension.ToLowerInvariant()) { return $false }
    if ((Get-RelPath $File.FullName) -like 'frontend\public\pdf\*') { return $false }
    return $true
}

function Convert-Name([string]$Name) {
    $result = $Name
    $result = $result -creplace 'KAGE', 'GMP'
    $result = $result -creplace 'Kage', 'GMP'
    $result = $result -creplace '(?<![A-Za-z0-9])kage', 'gmp'
    return $result
}

function Protect-Provenance([string]$Text) {
    $protected = [regex]::Replace($Text, '(?i)kage-verbatim', $VerbatimToken)
    $protected = [regex]::Replace($protected, '(?i)reference/kage', $ReferenceToken)
    return $protected
}

function Restore-Provenance([string]$Text) {
    return $Text.Replace($VerbatimToken, 'kage-verbatim').Replace($ReferenceToken, 'reference/kage')
}

# El orden importa: primero mayusculas exactas y despues la palabra suelta en
# minusculas, para no convertir identificadores como "package" o "breakage".
function Convert-KageText([string]$Text) {
    $result = $Text.Replace('/kage/', '/gmp/')
    $result = $result -creplace 'KAGE', 'GMP'
    $result = $result -creplace 'Kage', 'GMP'
    $result = $result -creplace '(?<![A-Za-z0-9])kage', 'gmp'
    return $result
}

function Convert-WithProtection([string]$Text) {
    return Restore-Provenance (Convert-KageText (Protect-Provenance $Text))
}

# README y CHANGELOG documentan procedencia: las lineas que la describen se
# dejan intactas aunque nombren la fuente original.
function Convert-RootDoc([string]$Text) {
    $parts = [regex]::Split($Text, '(\r\n|\n|\r)')
    for ($i = 0; $i -lt $parts.Count; $i += 2) {
        if ($parts[$i] -match $RootDocMarkers) {
            if ($parts[$i] -match '(?i)kage') { $script:DocSkippedLines++ }
            continue
        }
        $parts[$i] = Convert-WithProtection $parts[$i]
    }
    return ($parts -join '')
}

function Get-RenamePlan {
    $plan = New-Object System.Collections.Generic.List[object]
    foreach ($item in (Get-ChildItemsPruned $Frontend)) {
        if ($item.Name -notmatch '(?i)kage') { continue }
        if ($item.FullName -eq $SelfPath) { continue }
        $newName = Convert-Name $item.Name
        if ($newName -ceq $item.Name) { continue }
        $oldRel = Get-RelPath $item.FullName
        $parent = Split-Path -Parent $oldRel
        $newRel = if ([string]::IsNullOrEmpty($parent)) { $newName } else { Join-Path $parent $newName }
        $plan.Add([pscustomobject]@{
            OldRel = $oldRel
            NewRel = $newRel
            OldFull = $item.FullName
            NewFull = (Join-Path $Root $newRel)
            IsDir  = [bool]$item.PSIsContainer
            Depth  = ($oldRel -split '\\').Count
        })
    }
    # Hijos antes que padres: renombrar un hijo nunca invalida la ruta del padre.
    return @($plan | Sort-Object -Property @{ Expression = { $_.Depth }; Descending = $true }, @{ Expression = { $_.OldRel.Length }; Descending = $true })
}

function Get-TextTargets {
    $targets = New-Object System.Collections.Generic.List[object]
    foreach ($item in (Get-ChildItemsPruned $Frontend)) {
        if ($item.PSIsContainer) { continue }
        if (Test-TextFile $item) { $targets.Add($item) }
    }
    if (Test-Path -LiteralPath $ScriptsDir -PathType Container) {
        foreach ($item in (Get-ChildItemsPruned $ScriptsDir)) {
            if ($item.PSIsContainer) { continue }
            if ($item.FullName -eq $SelfPath) { continue }
            if ($item.FullName -eq $ReadmeRenamePath) { continue }
            if (Test-TextFile $item) { $targets.Add($item) }
        }
    }
    foreach ($doc in @('README.md', 'CHANGELOG.md', '.env.example')) {
        $docPath = Join-Path $Root $doc
        if (Test-Path -LiteralPath $docPath -PathType Leaf) {
            $targets.Add((Get-Item -LiteralPath $docPath))
        }
    }
    return $targets
}

function Get-Residues {
    $hits = New-Object System.Collections.Generic.List[object]
    foreach ($item in (Get-ChildItemsPruned $Frontend)) {
        if ($item.PSIsContainer) { continue }
        if (-not (Test-TextFile $item)) { continue }
        if ($item.Length -gt $MaxTextBytes) { continue }
        $found = @(Select-String -LiteralPath $item.FullName `
                -Pattern '(?i)(?<![A-Za-z0-9])kage' `
                -CaseSensitive:$false -ErrorAction SilentlyContinue)
        foreach ($match in $found) {
            # La copia literal autorizada se conserva a proposito.
            if ($match.Line -match 'reference/kage') { continue }
            $hits.Add([pscustomobject]@{
                File = (Get-RelPath $item.FullName)
                Line = $match.LineNumber
                Text = $match.Line.Trim()
            })
        }
    }
    return $hits
}

# ---------------------------------------------------------------- snapshot ---
$dirty = @()
if ($GitAvailable) {
    $status = & git -C $Root status --porcelain 2>$null
    # El propio script y su README pueden estar sin rastrear sin invalidar el guard.
    $dirty = @($status | Where-Object { $_ -and $_.Trim() } |
            Where-Object { $_ -notmatch 'scripts[/\\](rename-kage-to-gmp\.ps1|README-RENAME-KAGE\.md)$' })
}

Write-Info "Cambios sin confirmar en git: $($dirty.Count)"
if ($Apply -and -not $Force -and $dirty.Count -gt 0) {
    Write-Fail "El arbol de trabajo no esta limpio ($($dirty.Count) entradas). Revisa y confirma, o usa -Force."
    $dirty | Select-Object -First 10 | ForEach-Object { Write-Host "  $_" }
    exit 1
}

$lockPath = Join-Path $Frontend 'package-lock.json'
$lockHashBefore = $null
if (Test-Path -LiteralPath $lockPath -PathType Leaf) {
    $lockHashBefore = (Get-FileHash -Algorithm SHA256 -LiteralPath $lockPath).Hash
}

# ------------------------------------------------------------- fase 1 --------
Write-Info ''
Write-Info 'FASE 1 - renombrado de directorios y archivos'
$renamePlan = @(Get-RenamePlan)

if ($renamePlan.Count -eq 0) {
    Write-Info 'Nada que renombrar: no hay rutas con "kage" bajo frontend/.'
} else {
    foreach ($entry in $renamePlan) {
        $kind = if ($entry.IsDir) { 'dir ' } else { 'file' }
        Write-Info ("  {0} {1} -> {2}" -f $kind, $entry.OldRel, $entry.NewRel)
    }
}

$conflicts = @($renamePlan | Where-Object { Test-Path -LiteralPath $_.NewFull })
$duplicates = @($renamePlan | Group-Object NewRel | Where-Object { $_.Count -gt 1 })

if ($conflicts.Count -gt 0 -or $duplicates.Count -gt 0) {
    foreach ($conflict in $conflicts) {
        Write-Fail "El destino ya existe: $($conflict.NewRel)"
    }
    foreach ($duplicate in $duplicates) {
        Write-Fail "Dos renombrados colisionan en: $($duplicate.Name)"
    }
    Write-Fail 'Fase 1 abortada sin tocar nada.'
    exit 1
}

if ($Apply -and -not $Force) {
    $answer = Read-Host "$Mode Se renombraran $($renamePlan.Count) rutas y se reescribiran archivos de texto. Escribe APPLY para continuar"
    if ($answer -notmatch '(?i)^(apply|s|si|y|yes)$') {
        Write-Info 'Cancelado por el usuario. No se ha modificado nada.'
        exit 2
    }
}

if ($Apply) {
    foreach ($entry in $renamePlan) {
        $usedGit = $false
        if ($GitAvailable) {
            $gitOld = $entry.OldRel -replace '\\', '/'
            $gitNew = $entry.NewRel -replace '\\', '/'
            & git -C $Root mv -- $gitOld $gitNew *> $null
            if ($LASTEXITCODE -eq 0) { $usedGit = $true }
        }
        if (-not $usedGit) {
            Move-Item -LiteralPath $entry.OldFull -Destination $entry.NewFull -ErrorAction Stop
        }
        $via = if ($usedGit) { 'git mv' } else { 'Move-Item' }
        Write-Info ("  renombrado ({0}): {1} -> {2}" -f $via, $entry.OldRel, $entry.NewRel)
    }
}

# ------------------------------------------------------------- fase 2 --------
Write-Info ''
Write-Info 'FASE 2 - reemplazo de texto'
$targets = @(Get-TextTargets)
$modified = New-Object System.Collections.Generic.List[object]
$untouched = 0

foreach ($file in $targets) {
    if ($file.Length -gt $MaxTextBytes) {
        Write-Alert "Se omite por tamano ($([int]($file.Length / 1024)) KB): $(Get-RelPath $file.FullName)"
        continue
    }
    $original = [System.IO.File]::ReadAllText($file.FullName)
    $isRootDoc = ($file.FullName -eq (Join-Path $Root 'README.md')) -or ($file.FullName -eq (Join-Path $Root 'CHANGELOG.md'))
    $updated = if ($isRootDoc) { Convert-RootDoc $original } else { Convert-WithProtection $original }

    if ($updated -ceq $original) {
        $untouched++
        continue
    }

    $relative = Get-RelPath $file.FullName
    $modified.Add([pscustomobject]@{ Path = $relative; Full = $file.FullName })

    if ($Apply) {
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($file.FullName, $updated, $utf8NoBom)
        Write-Info "  modificado: $relative"
    } else {
        Write-Info "  se modificaria: $relative"
    }

    $leftover = ([regex]::Matches($updated, '(?i)(?<![A-Za-z0-9])kage')).Count
    if ($leftover -gt 0) {
        Write-Alert "$relative conserva $leftover coincidencias kage (revisar a mano)"
    }
}

Write-Info "Archivos analizados: $($targets.Count), sin cambios: $untouched, afectados: $($modified.Count)"
if ($script:DocSkippedLines -gt 0) {
    Write-Info "Lineas de procedencia preservadas en README/CHANGELOG: $($script:DocSkippedLines)"
}

# ------------------------------------------------------------- fase 3 --------
Write-Info ''
Write-Info 'FASE 3 - informe final'

if ($Apply) {
    Write-Info "Renombrados aplicados: $($renamePlan.Count)"
    Write-Info "Archivos modificados: $($modified.Count)"
} else {
    Write-Info "Renombrados previstos: $($renamePlan.Count)"
    Write-Info "Archivos que se modificarian: $($modified.Count)"
}

$residues = @(Get-Residues)
if ($residues.Count -eq 0) {
    Write-Info 'Residuos "kage" en frontend/: ninguno (excluye reference, caches y binarios).'
} else {
    Write-Alert "Residuos 'kage' en frontend/: $($residues.Count) coincidencias"
    $residues | Select-Object -First 20 | ForEach-Object {
        Write-Host ("  {0}:{1}  {2}" -f $_.File, $_.Line, $_.Text)
    }
    if ($residues.Count -gt 20) {
        Write-Host "  ... y $($residues.Count - 20) mas"
    }
}

# package.json debe conservar su nombre real de paquete.
$packagePath = Join-Path $Frontend 'package.json'
if (Test-Path -LiteralPath $packagePath -PathType Leaf) {
    $package = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json
    $nameProperty = $package.PSObject.Properties['name']
    if ($null -eq $nameProperty -or [string]::IsNullOrWhiteSpace([string]$nameProperty.Value)) {
        Write-Alert 'frontend/package.json no tiene un campo "name" valido.'
    } else {
        Write-Info "package.json name: $($nameProperty.Value)"
    }
} else {
    Write-Alert 'No se encontro frontend/package.json.'
}

# package-lock.json se excluye del reemplazo y se verifica por hash.
if ($null -ne $lockHashBefore) {
    $lockHashAfter = (Get-FileHash -Algorithm SHA256 -LiteralPath $lockPath).Hash
    if ($lockHashAfter -eq $lockHashBefore) {
        Write-Info 'package-lock.json: intacto.'
    } else {
        Write-Alert 'package-lock.json cambio de hash. Revisa el diff antes de continuar.'
    }
}

Write-Info ''
if ($Apply) {
    Write-Info 'Hecho. Revisa git status y ejecuta las comprobaciones de scripts/README-RENAME-KAGE.md.'
} else {
    Write-Info 'Dry-run completado. No se ha modificado ningun archivo.'
    Write-Info 'Para aplicar: ./rename-kage-to-gmp.ps1 -Apply'
}

exit 0
