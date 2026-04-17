# granite_tasty_remove_right_panels.ps1
$ErrorActionPreference = "Stop"

$projectRoot = "C:\Users\alexm\granite_tasty_skeleton"
$appFile = Join-Path $projectRoot "frontend\src\App.tsx"

if (-not (Test-Path $projectRoot)) {
    throw "Project root not found: $projectRoot"
}

if (Test-Path $appFile) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    Copy-Item $appFile "$appFile.bak_$timestamp" -Force
}

$content = @'
import { useState } from 'react';
import PositionsPanel from './components/PositionsPanel';

export default function App() {
  const [watchlistOpen, setWatchlistOpen] = useState(false);

  return (
    <div style={{
      background: '#050505',
      color: '#fff',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>

      {/* TOP ROW */}
      <div style={{
        height: '90px',
        display: 'flex',
        gap: '8px',
        padding: '8px'
      }}>
        <div style={{ width: '300px', background: '#111', borderRadius: '8px', padding: '10px' }}>
          KPI BLOCK
        </div>
        <div style={{ flex: 1, background: '#111', borderRadius: '8px', padding: '10px' }}>
          MARQUEE
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, padding: '8px', display: 'flex' }}>
        <div style={{ flex: 1, background: '#111', borderRadius: '8px', overflow: 'hidden' }}>
          <PositionsPanel />
        </div>
      </div>

      {/* WATCHLIST TOGGLE */}
      <button onClick={() => setWatchlistOpen(!watchlistOpen)}
        style={{
          position: 'absolute',
          top: '100px',
          left: '8px',
          zIndex: 1000
        }}>
        WL
      </button>

      {/* WATCHLIST OVERLAY */}
      {watchlistOpen && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: '300px',
          background: '#111',
          zIndex: 999,
          padding: '10px'
        }}>
          WATCHLIST
        </div>
      )}

    </div>
  );
}
'@

Set-Content -Path $appFile -Value $content -Encoding UTF8

Write-Host "Removed right-side panels (vol + scanner). Rebuild frontend."
