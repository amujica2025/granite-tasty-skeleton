import { useMemo } from 'react';

type MiniPriceChartProps = {
  symbol: string | null;
};

function buildSeries(symbol: string | null): number[] {
  const seed = symbol ? symbol.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) : 100;
  const base = 60 + (seed % 140);
  return Array.from({ length: 56 }, (_, index) => {
    const wave = Math.sin((index + seed) / 5) * 2.3;
    const drift = (index - 28) * 0.06;
    const jitter = ((seed + index * 17) % 13) / 11;
    return Math.max(1, Math.round((base + wave + drift + jitter) * 100) / 100);
  });
}

export default function MiniPriceChart({ symbol }: MiniPriceChartProps) {
  const { path, last } = useMemo(() => {
    const values = buildSeries(symbol);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const points = values.map((value, index) => {
      const x = (index / Math.max(1, values.length - 1)) * 100;
      const y = max === min ? 24 : 44 - ((value - min) / (max - min)) * 38;
      return `${x},${y}`;
    });
    return { path: points.join(' '), last: values[values.length - 1] };
  }, [symbol]);

  return (
    <div
      style={{
        height: '100%',
        minHeight: 0,
        display: 'grid',
        gridTemplateRows: '22px 1fr',
        background: '#050505',
        borderTop: '1px solid #0f0f0f',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          fontSize: 10,
          letterSpacing: '0.04em',
          color: '#7c8798',
          borderBottom: '1px solid #0d0d0d',
        }}
      >
        <span>PRICE CONTEXT</span>
        <span>{symbol ? `${symbol} ${last.toFixed(2)}` : '—'}</span>
      </div>
      <div style={{ width: '100%', height: '100%', minHeight: 0, padding: 8 }}>
        <svg viewBox="0 0 100 48" preserveAspectRatio="none" width="100%" height="100%">
          <polyline fill="rgba(96,165,250,0.16)" stroke="none" points={`0,48 ${path} 100,48`} />
          <polyline fill="none" stroke="#60a5fa" strokeWidth="1.8" points={path} />
        </svg>
      </div>
    </div>
  );
}
