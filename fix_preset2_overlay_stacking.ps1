param()

$ErrorActionPreference = "Stop"

$root = Get-Location
$appPath = Join-Path $root "frontend\src\App.tsx"
$cssPath = Join-Path $root "frontend\src\index.css"

if (-not (Test-Path $appPath)) {
    throw "Run this from repo root. Missing frontend\src\App.tsx"
}
if (-not (Test-Path $cssPath)) {
    throw "Run this from repo root. Missing frontend\src\index.css"
}

$app = Get-Content $appPath -Raw
$css = Get-Content $cssPath -Raw

if ($css -notmatch '\.gt-panel\s*\{[^}]*position:\s*relative;') {
    $css = $css -replace '(\.gt-panel\s*\{)', "`$1`r`n  position: relative;"
}

$app = $app -replace '<div className="gt-panel gt-green" style={areaStyle\(layout.watchlist\)}>',
'<div className="gt-panel gt-green" style={{ ...areaStyle(layout.watchlist), zIndex: layoutState === "sides_bundle" ? 30 : 1 }}>'

$app = $app -replace '<div className="gt-panel gt-yellow" style={areaStyle\(layout.scanners\)}>',
'<div className="gt-panel gt-yellow" style={{ ...areaStyle(layout.scanners), zIndex: layoutState === "sides_bundle" ? 30 : 1 }}>'

$app = $app -replace '<div className="gt-panel gt-red" style={areaStyle\(layout.infoHub\)}>',
'<div className="gt-panel gt-red" style={{ ...areaStyle(layout.infoHub), zIndex: 5 }}>'

$app = $app -replace '<div className="gt-panel gt-blue" style={areaStyle\(layout.positions\)}>',
'<div className="gt-panel gt-blue" style={{ ...areaStyle(layout.positions), zIndex: 5 }}>'

Set-Content $appPath $app -Encoding UTF8
Set-Content $cssPath $css -Encoding UTF8

Write-Host "Overlay fix applied"
