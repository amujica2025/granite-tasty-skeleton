# granite_tasty_fix_default_viewport.ps1
$ErrorActionPreference = "Stop"

$projectRoot = "C:\Users\alexm\granite_tasty_skeleton"
$appFile = Join-Path $projectRoot "frontend\src\App.tsx"

if (-not (Test-Path $appFile)) {
    throw "App.tsx not found: $appFile"
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item $appFile "$appFile.bak_$timestamp" -Force

$content = Get-Content $appFile -Raw

# 1) import useRef
$content = $content -replace "import \{ useEffect, useMemo, useState \} from 'react';", "import { useEffect, useMemo, useRef, useState } from 'react';"

# 2) add viewport ref right after tickers state
$content = $content -replace [regex]::Escape("  const [tickers, setTickers] = useState<TickerCard[]>(tickerSeed);"), @"
  const [tickers, setTickers] = useState<TickerCard[]>(tickerSeed);
  const viewportRef = useRef<HTMLDivElement | null>(null);
"@

# 3) add viewport-centering effect before kpiCards memo
$content = $content -replace [regex]::Escape("  const kpiCards = useMemo("), @"
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const centerDefaultField = () => {
      const worldWidth = el.scrollWidth;
      const viewWidth = el.clientWidth;
      const centeredLeft = Math.max(0, (worldWidth - viewWidth) / 2);
      el.scrollLeft = centeredLeft;
    };

    centerDefaultField();
    const t = setTimeout(centerDefaultField, 50);
    window.addEventListener('resize', centerDefaultField);

    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', centerDefaultField);
    };
  }, [layoutState]);

  const kpiCards = useMemo(
"@

# 4) wrap current grid in viewport div
$content = $content -replace [regex]::Escape("""      <div
        style={{
          height: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gridTemplateRows: 'repeat(6, 1fr)',
          position: 'relative',
        }}
      >"""), @"
      <div
        ref={viewportRef}
        style={{
          width: '100%',
          height: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'thin',
          background: '#000000',
        }}
      >
        <div
          style={{
            minWidth: '166.6667vw',
            height: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gridTemplateRows: 'repeat(6, 1fr)',
            position: 'relative',
          }}
        >
"@

# 5) close the new wrapper before root closing tags
$oldTail = @"
        </div>
      </div>

      <style>{`
"@
$newTail = @"
        </div>
      </div>
      </div>

      <style>{`
"@
$content = $content -replace [regex]::Escape($oldTail), $newTail

Set-Content -Path $appFile -Value $content -Encoding UTF8

Write-Host ""
Write-Host "Applied default viewport centering fix to App.tsx" -ForegroundColor Green
Write-Host ""
Write-Host "Run next:" -ForegroundColor Yellow
Write-Host "cd C:\Users\alexm\granite_tasty_skeleton\frontend; npm run build" -ForegroundColor White
