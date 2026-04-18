param()

$ErrorActionPreference = "Stop"

$root = Get-Location
$appPath = Join-Path $root "frontend\src\App.tsx"

if (-not (Test-Path $appPath)) {
    throw "Run this from repo root. Missing frontend\src\App.tsx"
}

$backupRoot = Join-Path $root ("backup_final_layout_" + (Get-Date -Format "yyyyMMdd_HHmmss"))
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
Copy-Item $appPath (Join-Path $backupRoot "App.tsx") -Force

$app = Get-Content $appPath -Raw

# Replace layouts block completely
$newLayouts = @"
const layouts = {
  default: {
    newPanel:   { colStart: 2, colSpan: 1, rowStart: 1, rowSpan: 6 },
    watchlist:  { colStart: 3, colSpan: 1, rowStart: 1, rowSpan: 6 },
    infoHub:    { colStart: 4, colSpan: 4, rowStart: 1, rowSpan: 2 },
    positions:  { colStart: 4, colSpan: 4, rowStart: 3, rowSpan: 4 },
    scanners:   { colStart: 8, colSpan: 1, rowStart: 1, rowSpan: 6 },
    newPanel2:  { colStart: 9, colSpan: 1, rowStart: 1, rowSpan: 6 },
  },

  sidesExpanded: {
    newPanel:   { colStart: 1, colSpan: 2, rowStart: 1, rowSpan: 6 },
    watchlist:  { colStart: 3, colSpan: 2, rowStart: 1, rowSpan: 6 },
    infoHub:    { colStart: 4, colSpan: 4, rowStart: 1, rowSpan: 2 },
    positions:  { colStart: 4, colSpan: 4, rowStart: 3, rowSpan: 4 },
    scanners:   { colStart: 7, colSpan: 2, rowStart: 1, rowSpan: 6 },
    newPanel2:  { colStart: 9, colSpan: 2, rowStart: 1, rowSpan: 6 },
  },

  positionsExpanded: {
    newPanel:   { colStart: 1, colSpan: 2, rowStart: 1, rowSpan: 6 },
    watchlist:  { colStart: 3, colSpan: 1, rowStart: 1, rowSpan: 6 },
    infoHub:    { colStart: 4, colSpan: 4, rowStart: 1, rowSpan: 1 },
    positions:  { colStart: 4, colSpan: 4, rowStart: 2, rowSpan: 5 },
    scanners:   { colStart: 8, colSpan: 1, rowStart: 1, rowSpan: 6 },
    newPanel2:  { colStart: 9, colSpan: 2, rowStart: 1, rowSpan: 6 },
  }
};
"@

$app = [regex]::Replace($app, 'const layouts[\s\S]*?\};', $newLayouts)

Set-Content $appPath $app -Encoding UTF8

Write-Host ""
Write-Host "Applied FINAL layout config."
Write-Host "Backup saved to: $backupRoot"
Write-Host ""
Write-Host "Rebuild frontend:"
Write-Host "cd frontend"
Write-Host "npm run build"
