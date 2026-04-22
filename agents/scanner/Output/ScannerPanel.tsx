// frontend/src/components/ScannerPanel.tsx

import React, { useEffect, useMemo, useState } from 'react';
import {
  buildEntryCandidates,
  buildRollCandidates,
} from './scanner/scannerUtils';
import {
  ChainRow,
  PositionRow,
  ScannerCandidate,
  ScannerMode,
} from './scanner/scannerTypes';

export default function ScannerPanel() {
  const [mode, setMode] = useState<ScannerMode>('entry');
  const [symbol, setSymbol] = useState('SPY');

  const [chain, setChain] = useState<ChainRow[]>([]);
  const [positions, setPositions] = useState<PositionRow[]>([]);

  useEffect(() => {
    fetch(`/api/chain?symbol=${symbol}`)
      .then((r) => r.json())
      .then(setChain)
      .catch(() => setChain([]));
  }, [symbol]);

  useEffect(() => {
    fetch(`/api/positions`)
      .then((r) => r.json())
      .then(setPositions)
      .catch(() => setPositions([]));
  }, []);

  const candidates: ScannerCandidate[] = useMemo(() => {
    if (mode === 'entry') {
      return buildEntryCandidates(chain, symbol);
    }
    return buildRollCandidates(positions, chain, symbol);
  }, [mode, chain, positions, symbol]);

  return (
    <div style={{ padding: 12 }}>
      <h3>Scanner</h3>

      <div>
        <button onClick={() => setMode('entry')}>Entry</button>
        <button onClick={() => setMode('roll')}>Roll</button>
      </div>

      <input
        value={symbol}
        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
      />

      <table style={{ width: '100%', marginTop: 12 }}>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Structure</th>
            <th>Credit</th>
            <th>Debit</th>
            <th>Net</th>
            <th>BP</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c, i) => (
            <tr key={i}>
              <td>{c.symbol}</td>
              <td>{c.structure}</td>
              <td>{c.credit.toFixed(2)}</td>
              <td>{c.debit.toFixed(2)}</td>
              <td>{c.net.toFixed(2)}</td>
              <td>{c.bpEffect.toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}