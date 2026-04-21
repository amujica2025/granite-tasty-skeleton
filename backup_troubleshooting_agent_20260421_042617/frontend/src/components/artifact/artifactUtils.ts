import { ArtifactSurfaceNode, OptionChainRow } from './artifactTypes';

export function normalizeChainRows(rows: OptionChainRow[]): ArtifactSurfaceNode[] {
  const map = new Map<string, { ivs: number[] }>();

  rows.forEach((row) => {
    const expiry = row.expiration || row.expiry;
    const strike = row.strike;
    const iv = row.iv ?? row.impliedVolatility;

    if (!expiry || !Number.isFinite(strike) || !Number.isFinite(iv)) return;

    const key = `${expiry}_${strike}`;
    if (!map.has(key)) {
      map.set(key, { ivs: [] });
    }
    map.get(key)?.ivs.push(Number(iv));
  });

  return Array.from(map.entries()).map(([key, value]) => {
    const [expiry, strike] = key.split('_');
    const avgIv = value.ivs.reduce((sum, iv) => sum + iv, 0) / value.ivs.length;
    return { expiry, strike: Number(strike), iv: avgIv };
  });
}

export function buildSurfaceMatrix(nodes: ArtifactSurfaceNode[]) {
  const expiries = Array.from(new Set(nodes.map((node) => node.expiry))).sort();
  const strikes = Array.from(new Set(nodes.map((node) => node.strike))).sort((a, b) => a - b);

  const z = expiries.map((expiry) =>
    strikes.map((strike) => {
      const match = nodes.find((node) => node.expiry === expiry && node.strike === strike);
      return match ? match.iv : null;
    })
  );

  return { x: strikes, y: expiries, z };
}

export function buildSyntheticSurface(symbol: string): ArtifactSurfaceNode[] {
  const base = symbol.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const expiries = ['2026-05-15', '2026-06-19', '2026-07-17', '2026-08-21'];
  const center = 80 + (base % 220);
  const strikes = [-20, -10, 0, 10, 20].map((offset) => center + offset);

  return expiries.flatMap((expiry, expiryIndex) =>
    strikes.map((strike, strikeIndex) => ({
      expiry,
      strike,
      iv: Number((18 + expiryIndex * 2 + Math.abs(strikeIndex - 2) * 1.5 + (base % 7) * 0.3).toFixed(2)),
    }))
  );
}
