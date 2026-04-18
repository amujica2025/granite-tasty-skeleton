param()

$ErrorActionPreference = "Stop"

$root = Get-Location
$frontend = Join-Path $root "frontend"
$src = Join-Path $frontend "src"

if (-not (Test-Path $frontend)) {
    throw "Run this from the repo root that contains the frontend folder."
}

$backupRoot = Join-Path $root ("backup_layout_only_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
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

if (-not (Test-Path $appPath)) { throw "Missing frontend\src\App.tsx" }
if (-not (Test-Path $cssPath)) { throw "Missing frontend\src\index.css" }

$app = Get-Content $appPath -Raw
$css = Get-Content $cssPath -Raw

$app = [regex]::Replace($app, 'const\s+COL_WIDTH\s*=\s*\d+;', 'const COL_WIDTH = 500;')
$app = [regex]::Replace($app, 'const\s+TOTAL_COLS\s*=\s*\d+;', 'const TOTAL_COLS = 10;')
$app = [regex]::Replace($app, 'const\s+SHEET_HEIGHT\s*=\s*\d+;', 'const SHEET_HEIGHT = 930;')

$css = [regex]::Replace($css, 'grid-template-columns:\s*repeat\(\s*\d+\s*,\s*\d+px\s*\);', 'grid-template-columns: repeat(10, 500px);')
$css = [regex]::Replace($css, 'grid-template-rows:\s*[^;]+;', 'grid-template-rows: repeat(6, 155px);')

Set-Content -Path $appPath -Value $app -Encoding UTF8
Set-Content -Path $cssPath -Value $css -Encoding UTF8

Write-Host ""
Write-Host "Applied layout-only patch:"
Write-Host "  - columns: 10 x 500px"
Write-Host "  - rows: 6 x 155px"
Write-Host "  - total height: 930px"
Write-Host "  - no logic or wiring changes"
Write-Host ""
Write-Host "Backups saved to: $backupRoot"
Write-Host ""
Write-Host "Next:"
Write-Host "  cd frontend"
Write-Host "  npm run build"
