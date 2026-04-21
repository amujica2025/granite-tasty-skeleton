// frontend/src/components/artifact/artifactUtils.ts

import { ArtifactSurfaceNode, OptionChainRow } from './artifactTypes';

export function normalizeChainRows(rows: OptionChainRow[]): ArtifactSurfaceNode[] {
  const map = new Map<string, { ivs: number[] }>();

  rows.forEach((r) => {
    const expiry = r.expiration || r.expiry;
    const strike = r.strike;
    const iv = r.iv ?? r.impliedVolatility;

    if (!expiry || !strike || !iv) return;

    const key = `${expiry}_${strike}`;
    if (!map.has(key)) {
      map.set(key, { ivs: [] });
    }
    map.get(key)!.ivs.push(iv);
  });

  return Array.from(map.entries()).map(([key, val]) => {
    const [expiry, strike] = key.split('_');
    const avgIv =
      val.ivs.reduce((sum, v) => sum + v, 0) / val.ivs.length;

    return {
      expiry,
      strike: Number(strike),
      iv: avgIv,
    };
  });
}

export function buildSurfaceMatrix(nodes: ArtifactSurfaceNode[]) {
  const expiries = Array.from(new Set(nodes.map((n) => n.expiry))).sort();
  const strikes = Array.from(new Set(nodes.map((n) => n.strike))).sort(
    (a, b) => a - b
  );

  const z = expiries.map((e) =>
    strikes.map((s) => {
      const match = nodes.find((n) => n.expiry === e && n.strike === s);
      return match ? match.iv : null;
    })
  );

  return { x: strikes, y: expiries, z };
}