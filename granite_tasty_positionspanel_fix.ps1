# granite_tasty_positionspanel_fix.ps1
# Overwrites frontend\src\components\PositionsPanel.tsx with the corrected file.
# Run from anywhere:
# powershell -ExecutionPolicy Bypass -File .\granite_tasty_positionspanel_fix.ps1

$ErrorActionPreference = "Stop"

$projectRoot = "C:\Users\alexm\granite_tasty_skeleton"
$targetDir = Join-Path $projectRoot "frontend\src\components"
$targetFile = Join-Path $targetDir "PositionsPanel.tsx"

if (-not (Test-Path $projectRoot)) {
    throw "Project root not found: $projectRoot"
}

if (-not (Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

if (Test-Path $targetFile) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = Join-Path $targetDir ("PositionsPanel.tsx.bak_" + $timestamp)
    Copy-Item $targetFile $backupFile -Force
    Write-Host "Backup created: $backupFile" -ForegroundColor Yellow
}

$content = @'
import { useState, useEffect, useRef } from 'react';

interface Position {
  id: string;
  symbol: string;
  qty: number;
  iv: number;
  mark: number;
  markChng: number;
  tradePrice: number;
  high: number;
  low: number;
  plOpen: number;
  cost: number;
  netLiq: number;
  bpEffect: number;
  intVal: number;
  dte: number;
  exDate: string;
  theta: number;
  delta: number;
  gamma: number;
  sector: string;
  industry: string;
  subIndustry: string;
}

export default function PositionsPanel() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tempQtys, setTempQtys] = useState<Record<string, number>>({});
  const [hoveredQtyId, setHoveredQtyId] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target as Node)) {
        setSelectedIds(new Set());
        setTempQtys({});
        setHoveredQtyId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const mockPositions: Position[] = [
      {
        id: '1',
        symbol: 'SPY 240620C550',
        qty: -5,
        iv: 18.4,
        mark: 12.35,
        markChng: -0.45,
        tradePrice: 12.8,
        high: 13.2,
        low: 12.1,
        plOpen: -225,
        cost: 6400,
        netLiq: -6175,
        bpEffect: 1250,
        intVal: 0,
        dte: 65,
        exDate: '2024-06-20',
        theta: -8.2,
        delta: 0.62,
        gamma: 0.012,
        sector: 'Equity',
        industry: 'ETF',
        subIndustry: 'ETF',
      },
      {
        id: '2',
        symbol: 'AAPL 240517P180',
        qty: 3,
        iv: 24.7,
        mark: 3.85,
        markChng: 0.65,
        tradePrice: 3.2,
        high: 4.1,
        low: 3.15,
        plOpen: 195,
        cost: 960,
        netLiq: 1155,
        bpEffect: -300,
        intVal: 0,
        dte: 31,
        exDate: '2024-05-17',
        theta: -4.1,
        delta: -0.38,
        gamma: 0.018,
        sector: 'Tech',
        industry: 'Hardware',
        subIndustry: 'Devices',
      },
      {
        id: '3',
        symbol: 'QQQ 240628C460',
        qty: -2,
        iv: 21.3,
        mark: 8.9,
        markChng: -1.2,
        tradePrice: 10.1,
        high: 10.5,
        low: 8.7,
        plOpen: -240,
        cost: 2020,
        netLiq: -1780,
        bpEffect: 920,
        intVal: 0,
        dte: 73,
        exDate: '2024-06-28',
        theta: -6.8,
        delta: 0.55,
        gamma: 0.009,
        sector: 'Equity',
        industry: 'ETF',
        subIndustry: 'ETF',
      },
    ];

    setPositions(mockPositions);
  }, []);

  const handleRowClick = (e: React.MouseEvent, id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (e.ctrlKey || e.metaKey) {
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }

      return new Set([id]);
    });

    setTempQtys({});
  };

  const updateQty = (id: string, actualQty: number, dir: 'up' | 'down') => {
    setTempQtys((prev) => {
      const current = prev[id] ?? actualQty;
      let nextQty = current;

      if (dir === 'up') nextQty = current + 1;
      if (dir === 'down') nextQty = current - 1;

      const next = { ...prev };

      if (nextQty === actualQty) {
        delete next[id];
      } else {
        next[id] = nextQty;
      }

      return next;
    });
  };

  return (
    <div
      ref={panelRef}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#1f1f1f',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#1f1f1f' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px' }}>Position</th>
              <th style={{ textAlign: 'right', padding: '8px' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '8px' }}>IV</th>
              <th style={{ textAlign: 'right', padding: '8px' }}>Mark</th>
              <th style={{ textAlign: 'right', padding: '8px' }}>P/L</th>
            </tr>
          </thead>

          <tbody>
            {positions.map((pos) => {
              const isSelected = selectedIds.has(pos.id);
              const displayQty = tempQtys[pos.id] ?? pos.qty;
              const isModified = tempQtys[pos.id] !== undefined;
              const showControls = hoveredQtyId === pos.id && isSelected;

              return (
                <tr
                  key={pos.id}
                  onClick={(e) => handleRowClick(e, pos.id)}
                  style={{
                    cursor: 'pointer',
                    borderBottom: '1px solid #333',
                    background: isModified ? 'rgba(250, 204, 21, 0.08)' : 'transparent',
                    outline: isSelected ? '1px solid #fff' : 'none',
                    outlineOffset: '-1px',
                  }}
                >
                  <td style={{ padding: '10px' }}>{pos.symbol}</td>

                  <td
                    onMouseEnter={() => setHoveredQtyId(pos.id)}
                    onMouseLeave={() => setHoveredQtyId(null)}
                    style={{ textAlign: 'right', padding: '10px', position: 'relative' }}
                  >
                    <span style={{ color: isModified ? '#facc15' : '#fff' }}>{displayQty}</span>

                    {showControls && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 4,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQty(pos.id, pos.qty, 'up');
                          }}
                          style={{
                            fontSize: 10,
                            background: '#1b1b1b',
                            color: '#cfcfcf',
                            border: '1px solid #444',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            lineHeight: 1,
                            padding: '1px 3px',
                          }}
                        >
                          ▲
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQty(pos.id, pos.qty, 'down');
                          }}
                          style={{
                            fontSize: 10,
                            background: '#1b1b1b',
                            color: '#cfcfcf',
                            border: '1px solid #444',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            lineHeight: 1,
                            padding: '1px 3px',
                          }}
                        >
                          ▼
                        </button>
                      </div>
                    )}
                  </td>

                  <td style={{ textAlign: 'right', padding: '10px' }}>{pos.iv}%</td>
                  <td style={{ textAlign: 'right', padding: '10px' }}>{pos.mark}</td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '10px',
                      color: pos.plOpen >= 0 ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {pos.plOpen}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
'@

Set-Content -Path $targetFile -Value $content -Encoding UTF8

Write-Host ""
Write-Host "PositionsPanel.tsx updated successfully." -ForegroundColor Green
Write-Host "Target: $targetFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next commands:" -ForegroundColor Yellow
Write-Host "cd C:\Users\alexm\granite_tasty_skeleton\frontend; npm run build" -ForegroundColor White
Write-Host ""
Write-Host "If backend needs restart later:" -ForegroundColor Yellow
Write-Host "cd C:\Users\alexm\granite_tasty_skeleton\backend; .\venv\Scripts\python main.py" -ForegroundColor White
