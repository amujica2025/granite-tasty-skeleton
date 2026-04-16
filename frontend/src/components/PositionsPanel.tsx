import { useState, useEffect } from 'react';

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

interface PositionsPanelProps {
  netLiq?: number | null;
}

export default function PositionsPanel({ netLiq = null }: PositionsPanelProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tempQtys, setTempQtys] = useState<Record<string, number>>({});
  const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, any>>({});

  // Live quotes for Watchlist sidebar
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/market');
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "RawFeed" && msg.data && msg.data.type === "FEED_DATA") {
          const feed = msg.data.data;
          if (feed[0] === "Quote") {
            const values = feed[1];
            const newQuotes: Record<string, any> = {};
            for (let i = 0; i < values.length; i += 5) {
              const symbol = values[i];
              newQuotes[symbol] = {
                bid: values[i + 1],
                ask: values[i + 2],
                bidSize: values[i + 3],
                askSize: values[i + 4],
              };
            }
            setWatchlistQuotes(prev => ({ ...prev, ...newQuotes }));
          }
        }
      } catch (e) {
        console.error('Watchlist quote parse error', e);
      }
    };
    return () => ws.close();
  }, []);

  // Mock positions for testing UI/features
  useEffect(() => {
    const mockPositions: Position[] = [
      { id: "1", symbol: "SPY 240620C550", qty: -5, iv: 18.4, mark: 12.35, markChng: -0.45, tradePrice: 12.80, high: 13.20, low: 12.10, plOpen: -225, cost: 6400, netLiq: -6175, bpEffect: 1250, intVal: 0, dte: 65, exDate: "2024-06-20", theta: -8.2, delta: 0.62, gamma: 0.012, sector: "Equity", industry: "Broad Market", subIndustry: "ETF" },
      { id: "2", symbol: "AAPL 240517P180", qty: 3, iv: 24.7, mark: 3.85, markChng: 0.65, tradePrice: 3.20, high: 4.10, low: 3.15, plOpen: 195, cost: 960, netLiq: 1155, bpEffect: -300, intVal: 0, dte: 31, exDate: "2024-05-17", theta: -4.1, delta: -0.38, gamma: 0.018, sector: "Technology", industry: "Consumer Electronics", subIndustry: "Hardware" },
      { id: "3", symbol: "QQQ 240628C460", qty: -2, iv: 21.3, mark: 8.90, markChng: -1.20, tradePrice: 10.10, high: 10.50, low: 8.70, plOpen: -240, cost: 2020, netLiq: -1780, bpEffect: 920, intVal: 0, dte: 73, exDate: "2024-06-28", theta: -6.8, delta: 0.55, gamma: 0.009, sector: "Equity", industry: "Broad Market", subIndustry: "ETF" },
    ];
    setPositions(mockPositions);
  }, []);

  const toggleRow = (id: string, e: React.MouseEvent) => {
    const newSelected = new Set(selectedIds);
    if (e.ctrlKey || e.metaKey) {
      newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
    } else {
      newSelected.clear();
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setTempQtys({});
  };

  const updateTempQty = (id: string, newQty: number) => {
    setTempQtys(prev => ({ ...prev, [id]: newQty }));
  };

  const selectedPositions = positions.filter(p => selectedIds.has(p.id));
  const bpEffect = selectedPositions.reduce((sum, p) => sum + (p.bpEffect || 0), 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1f1f1f', borderRadius: '12px', overflow: 'hidden', fontSize: '0.85em' }}>
      {/* KPI Group - Top Left, Single Set */}
      <div style={{ padding: '8px 16px', background: '#171717', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.93em' }}>
        <div>Net Liq: <span style={{ color: '#22c55e', fontWeight: '600' }}>${netLiq !== null ? netLiq.toLocaleString() : '—'}</span></div>
        <div>BP Effect: <span style={{ color: '#eab308' }}>${bpEffect.toFixed(0)}</span></div>
        <div style={{ marginLeft: 'auto', color: '#888' }}>25x NLV: ${netLiq !== null ? (netLiq * 25).toLocaleString() : '—'}</div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Watchlist with Live Quotes */}
        <div style={{ width: '280px', background: '#171717', borderRight: '1px solid #333', padding: '16px', overflow: 'auto' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05em' }}>Watchlist</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['SPY', 'AAPL', 'QQQ', 'TSLA', 'NVDA'].map(symbol => {
              const q = watchlistQuotes[symbol] || {};
              return (
                <div key={symbol} style={{ background: '#1f1f1f', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                  <div style={{ fontWeight: '600' }}>{symbol}</div>
                  <div style={{ fontSize: '1.05em', marginTop: '4px' }}>
                    Bid: {q.bid !== undefined ? q.bid : '—'} × {q.bidSize !== undefined ? q.bidSize : '—'}<br />
                    Ask: {q.ask !== undefined ? q.ask : '—'} × {q.askSize !== undefined ? q.askSize : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Positions Table */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#1f1f1f', zIndex: 10 }}>
              <tr style={{ borderBottom: '2px solid #444' }}>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Position</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>IV</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>Mark</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>Chng $</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>Trade $</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>High</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>Low</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>P/L $</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>Cost</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>Net Liq</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>BP Eff</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>IntVal</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>DTE</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>Ex Date</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>Θ</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>Δ</th>
                <th style={{ textAlign: 'right', padding: '8px 6px' }}>Γ</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Sector</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Industry</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Sub-Ind</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => {
                const isSelected = selectedIds.has(pos.id);
                const displayQty = tempQtys[pos.id] !== undefined ? tempQtys[pos.id] : pos.qty;
                const isModified = tempQtys[pos.id] !== undefined;

                return (
                  <tr key={pos.id} onClick={(e) => toggleRow(pos.id, e)}
                    style={{ background: isSelected ? '#27272a' : 'transparent', cursor: 'pointer', borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '10px 6px', fontWeight: '500' }}>{pos.symbol}</td>
                    <td style={{ textAlign: 'right', padding: '10px 6px', position: 'relative' }}>
                      <span style={{ color: isModified ? '#eab308' : '#fff' }}>{displayQty}</span>
                      {isSelected && (
                        <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', fontSize: '9px' }}>
                          <button onClick={(e) => { e.stopPropagation(); updateTempQty(pos.id, displayQty + 1); }} style={{ color: '#22c55e', background: 'none', border: 'none' }}>▲</button>
                          <button onClick={(e) => { e.stopPropagation(); updateTempQty(pos.id, displayQty - 1); }} style={{ color: '#ef4444', background: 'none', border: 'none' }}>▼</button>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.iv.toFixed(1)}%</td>
                    <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.mark.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '10px 6px', color: pos.markChng >= 0 ? '#22c55e' : '#ef4444' }}>{pos.markChng >= 0 ? '+' : ''}{pos.markChng.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.tradePrice.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.high.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.low.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '10px 6px', color: pos.plOpen >= 0 ? '#22c55e' : '#ef4444' }}>{pos.plOpen >= 0 ? '+' : ''}{pos.plOpen.toFixed(0)}</td>
                    <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.cost.toFixed(0)}</td>
                    <td style={{ textAlign: 'right', padding: '10px 6px', fontWeight: '600' }}>{pos.netLiq.toFixed(0)}</td>
                    <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.bpEffect.toFixed(0)}</td>
                    <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.intVal.toFixed(0)}</td>
                    <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.dte}</td>
                    <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.exDate}</td>
                    <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.theta.toFixed(1)}</td>
                    <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.delta.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '10px 6px' }}>{pos.gamma.toFixed(3)}</td>
                    <td style={{ padding: '10px 6px' }}>{pos.sector}</td>
                    <td style={{ padding: '10px 6px' }}>{pos.industry}</td>
                    <td style={{ padding: '10px 6px' }}>{pos.subIndustry}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Column - Single Set of Placeholders */}
        <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '12px' }}>
          <div style={{ flex: 1, background: '#1f1f1f', borderRadius: '12px', padding: '16px', border: '1px solid #333' }}>
            Charting Panel (placeholder)
          </div>
          <div style={{ flex: 1, background: '#1f1f1f', borderRadius: '12px', padding: '16px', border: '1px solid #333' }}>
            Vol Surface / Heatmap (placeholder)
          </div>
        </div>
      </div>

      {/* Compact Totals Row */}
      <div style={{ padding: '8px 16px', background: '#171717', borderTop: '1px solid #333', fontSize: '0.93em' }}>
        Totals: Net Liq: <span style={{ color: '#22c55e' }}>${netLiq !== null ? netLiq.toLocaleString() : '—'}</span> | 
        BP Effect: <span style={{ color: '#eab308' }}>${bpEffect.toFixed(0)}</span>
      </div>
    </div>
  );
}