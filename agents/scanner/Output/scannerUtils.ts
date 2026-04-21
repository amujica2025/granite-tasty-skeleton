// frontend/src/components/scanner/scannerUtils.ts

import { ChainRow, PositionRow, ScannerCandidate } from './scannerTypes';

export function getMid(row: ChainRow) {
  if (row.mark) return row.mark;
  if (row.bid && row.ask) return (row.bid + row.ask) / 2;
  if (row.bid) return row.bid;
  if (row.ask) return row.ask;
  return 0;
}

export function priceSpread(short: ChainRow, long: ChainRow, qty: number) {
  const shortVal = getMid(short) * qty * 100;
  const longVal = getMid(long) * qty * 100;
  return shortVal - longVal;
}

export function buildEntryCandidates(
  chain: ChainRow[],
  symbol: string
): ScannerCandidate[] {
  const candidates: ScannerCandidate[] = [];

  const puts = chain.filter((c) => c.type === 'put');
  const calls = chain.filter((c) => c.type === 'call');

  for (let i = 0; i < puts.length - 1; i++) {
    const short = puts[i];
    const long = puts[i + 1];

    const credit = priceSpread(short, long, 1);

    candidates.push({
      symbol,
      structure: `Put ${short.strike}/${long.strike}`,
      credit,
      debit: 0,
      net: credit,
      bpEffect: Math.abs(short.strike - long.strike) * 100,
      score: credit,
    });
  }

  for (let i = 0; i < calls.length - 1; i++) {
    const short = calls[i];
    const long = calls[i + 1];

    const credit = priceSpread(short, long, 1);

    candidates.push({
      symbol,
      structure: `Call ${short.strike}/${long.strike}`,
      credit,
      debit: 0,
      net: credit,
      bpEffect: Math.abs(short.strike - long.strike) * 100,
      score: credit,
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

export function buildRollCandidates(
  positions: PositionRow[],
  chain: ChainRow[],
  symbol: string
): ScannerCandidate[] {
  const candidates: ScannerCandidate[] = [];

  positions
    .filter((p) => p.symbol === symbol)
    .forEach((pos) => {
      const matching = chain.filter(
        (c) =>
          c.symbol === pos.symbol &&
          c.type === pos.type &&
          c.expiration !== pos.expiration
      );

      matching.forEach((target) => {
        const closeVal = (pos.mark || 0) * Math.abs(pos.quantity) * 100;
        const openVal = getMid(target) * Math.abs(pos.quantity) * 100;

        const net = openVal - closeVal;

        candidates.push({
          symbol,
          structure: `Roll ${pos.strike} → ${target.strike}`,
          credit: net > 0 ? net : 0,
          debit: net < 0 ? Math.abs(net) : 0,
          net,
          bpEffect: 0,
          score: net,
        });
      });
    });

  return candidates.sort((a, b) => b.score - a.score);
}