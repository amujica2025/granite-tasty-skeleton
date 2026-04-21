// frontend/src/components/artifact/ArtifactCanvas.tsx

import React, { useMemo } from 'react';
import Plot from 'react-plotly.js';
import { ArtifactPayload } from './artifactTypes';
import { normalizeChainRows, buildSurfaceMatrix } from './artifactUtils';

type Props = {
  payload: ArtifactPayload | null;
};

export default function ArtifactCanvas({ payload }: Props) {
  const surfaceData = useMemo(() => {
    if (!payload) return null;

    if (payload.source.type === 'surface') {
      const nodes = payload.source.nodes;
      return buildSurfaceMatrix(nodes);
    }

    if (payload.source.type === 'chain') {
      const nodes = normalizeChainRows(payload.source.rows);
      return buildSurfaceMatrix(nodes);
    }

    // synthetic fallback
    const expiries = ['1D', '3D', '7D', '14D'];
    const strikes = [90, 95, 100, 105, 110];

    const z = expiries.map(() =>
      strikes.map(() => Math.random() * 0.5 + 0.2)
    );

    return { x: strikes, y: expiries, z };
  }, [payload]);

  if (!surfaceData) {
    return <div style={{ padding: 12 }}>No data</div>;
  }

  return (
    <Plot
      data={[
        {
          type: 'surface',
          x: surfaceData.x,
          y: surfaceData.y,
          z: surfaceData.z,
        },
      ]}
      layout={{
        title: `${payload?.symbol} Vol Surface`,
        autosize: true,
        scene: {
          xaxis: { title: 'Strike' },
          yaxis: { title: 'Expiry' },
          zaxis: { title: 'IV' },
        },
        margin: { l: 0, r: 0, b: 0, t: 30 },
      }}
      style={{ width: '100%', height: '100%' }}
    />
  );
}