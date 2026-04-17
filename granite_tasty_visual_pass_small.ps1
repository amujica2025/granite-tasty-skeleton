# granite_tasty_visual_pass_small.ps1
$ErrorActionPreference = "Stop"

$projectRoot = "C:\Users\alexm\granite_tasty_skeleton"
$appFile = Join-Path $projectRoot "frontend\src\App.tsx"

if (-not (Test-Path $appFile)) {
    throw "App.tsx not found: $appFile"
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item $appFile "$appFile.bak_$timestamp" -Force

$content = Get-Content $appFile -Raw

$content = $content -replace [regex]::Escape("const panelStyle: React.CSSProperties = {
  background: '#0b0b0b',
  border: '1px solid #202020',
  overflow: 'hidden',
  minWidth: 0,
  minHeight: 0,
};"), @"
const railStyle: React.CSSProperties = {
  background: '#060606',
  borderRight: '1px solid #171717',
  overflow: 'hidden',
  minWidth: 0,
  minHeight: 0,
};

const centerStyle: React.CSSProperties = {
  background: '#040404',
  borderLeft: '1px solid #161616',
  borderRight: '1px solid #161616',
  overflow: 'hidden',
  minWidth: 0,
  minHeight: 0,
};
"@

$content = $content -replace [regex]::Escape("style={{ ...panelStyle, ...areaStyle(layout.watchlist) }}"), "style={{ ...railStyle, ...areaStyle(layout.watchlist) }}"
$content = $content -replace [regex]::Escape("style={{ ...panelStyle, ...areaStyle(layout.infoHub) }}"), "style={{ ...centerStyle, ...areaStyle(layout.infoHub) }}"
$content = $content -replace [regex]::Escape("style={{ ...panelStyle, ...areaStyle(layout.positions) }}"), "style={{ ...centerStyle, ...areaStyle(layout.positions) }}"
$content = $content -replace [regex]::Escape("style={{ ...panelStyle, ...areaStyle(layout.scanners) }}"), "style={{ ...railStyle, ...areaStyle(layout.scanners) }}"

$content = $content -replace [regex]::Escape("height: 30,"), "height: 22,"
$content = $content -replace [regex]::Escape("height: 'calc(100% - 30px)',"), "height: 'calc(100% - 22px)',"
$content = $content -replace [regex]::Escape("padding: '8px 10px',"), "padding: '4px 6px',"
$content = $content -replace [regex]::Escape("gap: 10,"), "gap: 8,"
$content = $content -replace [regex]::Escape("width: 160,"), "width: 120,"
$content = $content -replace [regex]::Escape("minWidth: 160,"), "minWidth: 120,"
$content = $content -replace [regex]::Escape("height: 70,"), "height: 38,"
$content = $content -replace [regex]::Escape("fontSize: 10, color: '#8f8f8f', textTransform: 'uppercase'"), "fontSize: 8, color: '#7e7e7e'"
$content = $content -replace [regex]::Escape("fontSize: 18, fontWeight: 700"), "fontSize: 16, fontWeight: 700"

Set-Content -Path $appFile -Value $content -Encoding UTF8

Write-Host ""
Write-Host "Applied small visual pass to App.tsx" -ForegroundColor Green
Write-Host ""
Write-Host "Run next:" -ForegroundColor Yellow
Write-Host "cd C:\Users\alexm\granite_tasty_skeleton\frontend; npm run build" -ForegroundColor White
