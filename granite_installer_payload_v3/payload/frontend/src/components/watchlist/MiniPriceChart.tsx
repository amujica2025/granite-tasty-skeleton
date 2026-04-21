import { useMemo } from 'react';

type MiniPriceChartProps = {
  symbol: string | null;
};

function buildSeries(symbol: string | null): number[] {
  const seed = symbol ? symbol.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) : 100;
  return Array.from({ length: 36 }, (_, index) => {
    const base = 60 + (seed % 140);
    const wave = Math.sin((index + seed) / 5) * 2.3;
    const drift = (index - 18) * 0.06;
    const jitter = ((seed + index * 17) % 13) / 11;
    return Math.max(1, Math.round((base + wave + drift + jitter) * 100) / 100);
  });
}

export default function MiniPriceChart({ symbol }: MiniPriceChartProps) {
  const series = useMemo(() => buildSeries(symbol), [symbol]);
  const min = Math.min(...series);
  const max = Math.max(...series);
  const points = series
    .map((value, index) => {
      const x = (index / (series.length - 1)) * 100;
      const ratio = max === min ? 0.5 : (value - min) / (max - min);
      const y = 88 - ratio * 76;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div style={{ height: '100%', minHeight: 0, display: 'grid', gridTemplateRows: '22px 1fr', background: '#050505', borderTop: '1px solid #0f0f0f' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', fontSize: 10, letterSpacing: '0.04em', color: '#7c8798', borderBottom: '1px solid #0d0d0d' }}>
        <span>PRICE CONTEXT</span>
        <span>{symbol ?? '—'}</span>
      </div>
      <div style={{ width: '100%', height: '100%', minHeight: 0, padding: 8 }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <polyline fill="none" stroke="#60a5fa" strokeWidth="2" points={points} />
        </svg>
      </div>
    </div>
  );
}
