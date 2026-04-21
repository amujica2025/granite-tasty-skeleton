import type { OptionChainRow } from './artifactTypes';
export function buildGrid(rows: OptionChainRow[]) {
  const expiries = Array.from(new Set(rows.map(r => r.expiration || '').filter(Boolean))).sort();
  const strikes = Array.from(new Set(rows.map(r => Number(r.strike || 0)).filter(Boolean))).sort((a,b)=>a-b);
  const z = expiries.map(exp => strikes.map(strike => rows.find(r => (r.expiration||'')===exp && Number(r.strike||0)===strike)?.iv ?? null));
  return { expiries, strikes, z };
}
