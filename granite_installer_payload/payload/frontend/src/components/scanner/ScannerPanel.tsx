import { useEffect, useMemo, useState } from 'react';
import { buildEntryCandidates, buildRollCandidates } from './scannerUtils';
import { ChainRow, PositionRow, ScannerCandidate, ScannerMode } from './scannerTypes';

function normalizeChainResponse(input: unknown, symbol: string): ChainRow[] {
  const source = Array.isArray(input)
    ? input
    : Array.isArray((input as { rows?: unknown[] })?.rows)
      ? (input as { rows: unknown[] }).rows
      : Array.isArray((input as { chain?: unknown[] })?.chain)
        ? (input as { chain: unknown[] }).chain
        : [];

  return source
    .map((row) => {
      const typed = row as Record<string, unknown>;
      const expiration = String(typed.expiration ?? typed.expiry ?? '');
      const strike = Number(typed.strike ?? typed.strike_price ?? NaN);
      const optionType = String(typed.type ?? typed.option_type ?? '').toLowerCase();
      if (!expiration || !Number.isFinite(strike) || (optionType !== 'call' && optionType !== 'put')) return null;
      return {
        symbol: String(typed.symbol ?? symbol),
        expiration,
        strike,
        type: optionType,
        bid: Number(typed.bid ?? NaN),
        ask: Number(typed.ask ?? NaN),
        mark: Number(typed.mark ?? typed.mid ?? NaN),
      } as ChainRow;
    })
    .filter((row): row is ChainRow => row !== null);
}

function normalizePositionsResponse(input: unknown): PositionRow[] {
  const source = Array.isArray(input)
    ? input
    : Array.isArray((input as { positions?: unknown[] })?.positions)
      ? (input as { positions: unknown[] }).positions
      : [];

  return source
    .map((row) => {
      const typed = row as Record<string, unknown>;
      const symbol = String(typed.symbol ?? typed.underlying ?? '');
      const strike = Number(typed.strike ?? typed.strike_price ?? NaN);
      const expiration = String(typed.expiration ?? typed.expiry ?? '');
      const optionType = String(typed.type ?? typed.option_type ?? '').toLowerCase();
      const quantity = Number(typed.quantity ?? typed.qty ?? 0);
      if (!symbol || !expiration || !Number.isFinite(strike) || !Number.isFinite(quantity)) return null;
      if (optionType !== 'call' && optionType !== 'put') return null;
      return {
        symbol,
        strike,
        expiration,
        type: optionType,
        quantity,
        mark: Number(typed.mark ?? typed.mark_price ?? NaN),
      } as PositionRow;
    })
    .filter((row): row is PositionRow => row !== null);
}

export default function ScannerPanel() {
  const [mode, setMode] = useState<ScannerMode>('entry');
  const [symbol, setSymbol] = useState('SPY');
  const [chain, setChain] = useState<ChainRow[]>([]);
  const [positions, setPositions] = useState<PositionRow[]>([]);

  useEffect(() => {
    fetch(`/api/chain?symbol=${symbol}`)
      .then((response) => response.json())
      .then((data) => setChain(normalizeChainResponse(data, symbol)))
      .catch(() => setChain([]));
  }, [symbol]);

  useEffect(() => {
    fetch('/api/positions')
      .then((response) => response.json())
      .then((data) => setPositions(normalizePositionsResponse(data)))
      .catch(() => setPositions([]));
  }, []);

  const candidates: ScannerCandidate[] = useMemo(() => {
    if (mode === 'entry') return buildEntryCandidates(chain, symbol);
    return buildRollCandidates(positions, chain, symbol);
  }, [chain, mode, positions, symbol]);

  return (
    <div style={{ height: '100%', minHeight: 0, display: 'grid', gridTemplateRows: 'auto auto 1fr', background: '#060606' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderBottom: '1px solid #171717', color: '#e5e7eb' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>SCANNER</div>
        <div style={{ fontSize: 10, color: '#9ca3af' }}>{candidates.length} rows</div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: 8, borderBottom: '1px solid #171717' }}>
        <button onClick={() => setMode('entry')}>Entry</button>
        <button onClick={() => setMode('roll')}>Roll</button>
        <input value={symbol} onChange={(event) => setSymbol(event.target.value.toUpperCase())} style={{ flex: '0 0 100px' }} />
      </div>

      <div style={{ minHeight: 0, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e5e7eb', fontSize: 11 }}>
          <thead>
            <tr style={{ position: 'sticky', top: 0, background: '#0b0b0b' }}>
              {['Symbol', 'Structure', 'Credit', 'Debit', 'Net', 'BP'].map((label) => (
                <th key={label} style={{ textAlign: label === 'Structure' ? 'left' : 'right', padding: '8px 10px', borderBottom: '1px solid #171717', color: '#9ca3af' }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate, index) => (
              <tr key={`${candidate.symbol}-${candidate.structure}-${index}`}>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #121212' }}>{candidate.symbol}</td>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid #121212' }}>{candidate.structure}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #121212' }}>{candidate.credit.toFixed(2)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #121212' }}>{candidate.debit.toFixed(2)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #121212', color: candidate.net >= 0 ? '#22c55e' : '#ef4444' }}>{candidate.net.toFixed(2)}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #121212' }}>{candidate.bpEffect.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
