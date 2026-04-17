$ErrorActionPreference = "Stop"

$projectRoot = "C:\Users\alexm\granite_tasty_skeleton"
$appFile = Join-Path $projectRoot "frontend\src\App.tsx"

if (!(Test-Path $appFile)) {
    throw "App.tsx not found"
}

# backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item $appFile "$appFile.bak_$timestamp" -Force

$content = Get-Content $appFile -Raw

Write-Host "Patching App.tsx..." -ForegroundColor Yellow

# --- 1. ensure useRef import ---
if ($content -notmatch "useRef") {
    $content = $content -replace "useState \} from 'react';", "useRef, useState } from 'react';"
}

# --- 2. inject viewportRef after useState block ---
$content = $content -replace "const \[tickers, setTickers\][\s\S]*?;", {
    param($match)
    return $match.Value + "`r`n  const viewportRef = useRef<HTMLDivElement | null>(null);"
}

# --- 3. inject viewport useEffect (only if not exists) ---
if ($content -notmatch "scrollLeft") {

$viewportCode = @"
useEffect(() => {
  const el = viewportRef.current;
  if (!el) return;

  const center = () => {
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  };

  center();
  setTimeout(center, 50);

  window.addEventListener('resize', center);
  return () => window.removeEventListener('resize', center);
}, []);
"@

$content = $content -replace "return \(", "$viewportCode`r`nreturn ("
}

# --- 4. wrap grid container ---
$content = $content -replace '<div\s+style=\{\{\s*height:\s*''100%''\s*,\s*display:\s*''grid''', @"
<div
  ref={viewportRef}
  style={{
    width: '100%',
    height: '100%',
    overflowX: 'auto',
    overflowY: 'hidden',
    background: '#000'
  }}
>
  <div
    style={{
      minWidth: '166.6667vw',
      height: '100%',
      display: 'grid'
"@

# --- 5. close wrapper (safe append) ---
$content = $content -replace "</div>\s*</div>\s*$", "</div>`r`n</div>`r`n</div>"

# write file
Set-Content -Path $appFile -Value $content -Encoding UTF8

Write-Host ""
Write-Host "Viewport fix applied successfully." -ForegroundColor Green
Write-Host ""
Write-Host "Next:"
Write-Host "cd C:\Users\alexm\granite_tasty_skeleton\frontend"
Write-Host "npm run build"