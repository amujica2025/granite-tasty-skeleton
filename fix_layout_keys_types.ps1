param()

$ErrorActionPreference = "Stop"

$root = Get-Location
$appPath = Join-Path $root "frontend\src\App.tsx"

if (-not (Test-Path $appPath)) {
    throw "Run this from repo root. Missing frontend\src\App.tsx"
}

$backupRoot = Join-Path $root ("backup_layout_key_fix_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
Copy-Item $appPath (Join-Path $backupRoot "App.tsx") -Force

$app = Get-Content $appPath -Raw

# Restore layout object typing and correct keys to match existing LayoutState union
$app = [regex]::Replace(
    $app,
    'const layouts\s*=\s*\{[\s\S]*?\n\};',
@"
const layouts: Record<LayoutState, LayoutConfig> = {
  default: {
    viewStartCol: 2,
    viewEndCol: 9,
    newPanel:   { colStart: 2, colSpan: 1, rowStart: 1, rowSpan: 6 },
    watchlist:  { colStart: 3, colSpan: 1, rowStart: 1, rowSpan: 6 },
    infoHub:    { colStart: 4, colSpan: 4, rowStart: 1, rowSpan: 2 },
    positions:  { colStart: 4, colSpan: 4, rowStart: 3, rowSpan: 4 },
    scanners:   { colStart: 8, colSpan: 1, rowStart: 1, rowSpan: 6 },
    newPanel2:  { colStart: 9, colSpan: 1, rowStart: 1, rowSpan: 6 },
  },

  sides_bundle: {
    viewStartCol: 1,
    viewEndCol: 10,
    newPanel:   { colStart: 1, colSpan: 2, rowStart: 1, rowSpan: 6 },
    watchlist:  { colStart: 3, colSpan: 2, rowStart: 1, rowSpan: 6 },
    infoHub:    { colStart: 4, colSpan: 4, rowStart: 1, rowSpan: 2 },
    positions:  { colStart: 4, colSpan: 4, rowStart: 3, rowSpan: 4 },
    scanners:   { colStart: 7, colSpan: 2, rowStart: 1, rowSpan: 6 },
    newPanel2:  { colStart: 9, colSpan: 2, rowStart: 1, rowSpan: 6 },
  },

  outer_plus_positions: {
    viewStartCol: 1,
    viewEndCol: 10,
    newPanel:   { colStart: 1, colSpan: 2, rowStart: 1, rowSpan: 6 },
    watchlist:  { colStart: 3, colSpan: 1, rowStart: 1, rowSpan: 6 },
    infoHub:    { colStart: 4, colSpan: 4, rowStart: 1, rowSpan: 1 },
    positions:  { colStart: 4, colSpan: 4, rowStart: 2, rowSpan: 5 },
    scanners:   { colStart: 8, colSpan: 1, rowStart: 1, rowSpan: 6 },
    newPanel2:  { colStart: 9, colSpan: 2, rowStart: 1, rowSpan: 6 },
  }
};
"@
)

Set-Content $appPath $app -Encoding UTF8

Write-Host ""
Write-Host "Fixed layout keys/types in App.tsx"
Write-Host "Backup saved to: $backupRoot"
Write-Host ""
Write-Host "Next:"
Write-Host "  cd frontend"
Write-Host "  npm run build"
