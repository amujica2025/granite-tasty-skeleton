import { useMemo } from 'react';
import { ArtifactPayload } from './artifactTypes';
import { buildSurfaceMatrix, buildSyntheticSurface, normalizeChainRows } from './artifactUtils';

type Props = {
  payload: ArtifactPayload | null;
};

function heat(iv: number | null) {
  if (iv === null || !Number.isFinite(iv)) return '#0b0b0b';
  if (iv >= 28) return 'rgba(239, 68, 68, 0.32)';
  if (iv >= 22) return 'rgba(245, 158, 11, 0.28)';
  return 'rgba(96, 165, 250, 0.24)';
}

export default function ArtifactCanvas({ payload }: Props) {
  const surface = useMemo(() => {
    if (!payload) return null;
    if (payload.source.type === 'surface') return buildSurfaceMatrix(payload.source.nodes);
    if (payload.source.type === 'chain') return buildSurfaceMatrix(normalizeChainRows(payload.source.rows));
    return buildSurfaceMatrix(buildSyntheticSurface(payload.symbol));
  }, [payload]);

  if (!payload || !surface) {
    return <div style={{ padding: 16, color: '#9ca3af' }}>No artifact payload loaded.</div>;
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateRows: '44px 1fr',
        background: '#0a0a0a',
        color: '#e5e7eb',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          borderBottom: '1px solid #171717',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{payload.symbol} Artifact</div>
          <div style={{ fontSize: 10, color: '#9ca3af' }}>{payload.source.type.toUpperCase()} surface</div>
        </div>
        <div style={{ fontSize: 10, color: '#9ca3af' }}>
          {surface.y.length} expiries · {surface.x.length} strikes
        </div>
      </div>

      <div style={{ minHeight: 0, overflow: 'auto', padding: 14 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `120px repeat(${surface.x.length}, minmax(72px, 1fr))`,
            gap: 6,
            alignItems: 'stretch',
          }}
        >
          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700 }}>EXPIRY / STRIKE</div>
          {surface.x.map((strike) => (
            <div key={`strike-${strike}`} style={{ fontSize: 10, color: '#9ca3af', textAlign: 'right', fontWeight: 700 }}>
              {strike}
            </div>
          ))}

          {surface.y.map((expiry, rowIndex) => (
            <>
              <div key={`expiry-${expiry}`} style={{ fontSize: 11, color: '#d1d5db', fontWeight: 700, paddingTop: 8 }}>
                {expiry}
              </div>
              {surface.z[rowIndex].map((iv, colIndex) => (
                <div
                  key={`${expiry}-${surface.x[colIndex]}`}
                  style={{
                    background: heat(iv),
                    border: '1px solid #171717',
                    minHeight: 58,
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-end',
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: 12,
                  }}
                >
                  {iv === null ? '—' : `${iv.toFixed(2)}%`}
                </div>
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
