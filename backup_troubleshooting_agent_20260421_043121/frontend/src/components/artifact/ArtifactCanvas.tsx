import { useMemo } from 'react';
import type { ArtifactPayload } from './artifactTypes';
import { buildSurfaceMatrix, normalizeChainRows } from './artifactUtils';

type Props = {
  payload: ArtifactPayload | null;
};

export default function ArtifactCanvas({ payload }: Props) {
  const surfaceData = useMemo(() => {
    if (!payload) return null;

    if (payload.source.type === 'surface') return buildSurfaceMatrix(payload.source.nodes);
    if (payload.source.type === 'chain') return buildSurfaceMatrix(normalizeChainRows(payload.source.rows));

    const expiries = ['1D', '3D', '7D', '14D'];
    const strikes = [90, 95, 100, 105, 110];
    const z = expiries.map((_, rowIndex) =>
      strikes.map((_, colIndex) => Number((0.18 + rowIndex * 0.03 + colIndex * 0.015).toFixed(3))),
    );
    return { x: strikes, y: expiries, z };
  }, [payload]);

  if (!surfaceData) return <div style={{ padding: 12, color: '#cbd5e1' }}>No data</div>;

  const flat = surfaceData.z.flat().filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const min = Math.min(...flat, 0);
  const max = Math.max(...flat, 1);

  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateRows: '36px 1fr', background: '#111', color: '#e5e7eb' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderBottom: '1px solid #222', fontSize: 12 }}>
        <span>{payload?.symbol} Vol Surface</span>
        <span>{surfaceData.y.length} expiries · {surfaceData.x.length} strikes</span>
      </div>
      <div style={{ padding: 12, overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `140px repeat(${surfaceData.x.length}, minmax(64px, 1fr))`, gap: 4 }}>
          <div />
          {surfaceData.x.map((strike) => (
            <div key={`head_${strike}`} style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8' }}>{strike}</div>
          ))}
          {surfaceData.y.map((expiry, rowIndex) => (
            <>
              <div key={`expiry_${expiry}`} style={{ fontSize: 11, color: '#94a3b8' }}>{expiry}</div>
              {surfaceData.x.map((strike, colIndex) => {
                const value = surfaceData.z[rowIndex]?.[colIndex];
                const ratio = typeof value === 'number' && max > min ? (value - min) / (max - min) : 0;
                return (
                  <div
                    key={`${expiry}_${strike}`}
                    style={{
                      textAlign: 'right',
                      padding: '6px 8px',
                      background: `rgba(96,165,250,${0.12 + ratio * 0.4})`,
                      border: '1px solid #1f2937',
                      fontSize: 11,
                    }}
                  >
                    {typeof value === 'number' ? value.toFixed(3) : '—'}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
