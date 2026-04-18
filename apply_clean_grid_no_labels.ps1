param()

$ErrorActionPreference = "Stop"

$root = Get-Location
$frontend = Join-Path $root "frontend"
$src = Join-Path $frontend "src"

if (-not (Test-Path $frontend)) {
    throw "Run this from the repo root."
}

$backupRoot = Join-Path $root ("backup_clean_grid_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null

foreach ($rel in @("frontend\src\App.tsx", "frontend\src\index.css")) {
    $full = Join-Path $root $rel
    if (Test-Path $full) {
        $dest = Join-Path $backupRoot $rel
        New-Item -ItemType Directory -Force -Path (Split-Path $dest -Parent) | Out-Null
        Copy-Item $full $dest -Force
    }
}

$appPath = Join-Path $src "App.tsx"
$cssPath = Join-Path $src "index.css"

$app = Get-Content $appPath -Raw
$css = Get-Content $cssPath -Raw

# core dimensions
$app = [regex]::Replace($app, 'const\s+COL_WIDTH\s*=\s*\d+;', 'const COL_WIDTH = 500;')
$app = [regex]::Replace($app, 'const\s+TOTAL_COLS\s*=\s*\d+;', 'const TOTAL_COLS = 10;')
$app = [regex]::Replace($app, 'const\s+SHEET_HEIGHT\s*=\s*\d+;', 'const SHEET_HEIGHT = 930;')

# clean grid (no label rows/cols)
$css = [regex]::Replace($css, 'grid-template-columns:\s*[^;]+;', 'grid-template-columns: repeat(10, 500px);')
$css = [regex]::Replace($css, 'grid-template-rows:\s*[^;]+;', 'grid-template-rows: repeat(6, 155px);')

# remove label styles (visual only, no logic touched)
$css = $css -replace '\.gt-col-label[^{]*\{[^}]*\}', ''
$css = $css -replace '\.gt-row-label[^{]*\{[^}]*\}', ''

Set-Content $appPath $app -Encoding UTF8
Set-Content $cssPath $css -Encoding UTF8

Write-Host ""
Write-Host "Applied CLEAN GRID:"
Write-Host " - 10 columns @ 500px"
Write-Host " - 6 rows @ 155px"
Write-Host " - NO header row"
Write-Host " - NO row number column"
Write-Host " - Logic untouched"
Write-Host ""
Write-Host "Backup at: $backupRoot"
