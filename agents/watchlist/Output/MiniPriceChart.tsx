import { useEffect, useRef } from 'react';
import {
  AreaSeries,
  ColorType,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
  createChart,
} from 'lightweight-charts';

type MiniPriceChartProps = {
  symbol: string | null;
};

function buildSeries(symbol: string | null): { time: UTCTimestamp; value: number }[] {
  const seed = symbol
    ? symbol.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
    : 100;

  const base = 60 + (seed % 140);
  const points: { time: UTCTimestamp; value: number }[] = [];

  for (let i = 0; i < 56; i += 1) {
    const wave = Math.sin((i + seed) / 5) * 2.3;
    const drift = (i - 28) * 0.06;
    const jitter = ((seed + i * 17) % 13) / 11;
    points.push({
      time: (1700000000 + i * 3600) as UTCTimestamp,
      value: Math.max(1, Math.round((base + wave + drift + jitter) * 100) / 100),
    });
  }

  return points;
}

export default function MiniPriceChart({ symbol }: MiniPriceChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight || 180,
      layout: {
        background: { type: ColorType.Solid, color: '#050505' },
        textColor: '#7c8798',
      },
      grid: {
        vertLines: { color: '#0d0d0d' },
        horzLines: { color: '#0d0d0d' },
      },
      rightPriceScale: {
        borderColor: '#111111',
        scaleMargins: { top: 0.1, bottom: 0.12 },
      },
      timeScale: {
        borderColor: '#111111',
        timeVisible: false,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: '#242424' },
        horzLine: { color: '#242424' },
      },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: '#60a5fa',
      topColor: 'rgba(96, 165, 250, 0.24)',
      bottomColor: 'rgba(96, 165, 250, 0.01)',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || !chartRef.current) return;
      const { width, height } = entry.contentRect;
      chartRef.current.applyOptions({
        width: Math.max(60, Math.floor(width)),
        height: Math.max(80, Math.floor(height)),
      });
      chartRef.current.timeScale().fitContent();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    seriesRef.current.setData(buildSeries(symbol));
    chartRef.current.timeScale().fitContent();
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
        <span>{symbol ?? '—'}</span>
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 0 }} />
    </div>
  );
}