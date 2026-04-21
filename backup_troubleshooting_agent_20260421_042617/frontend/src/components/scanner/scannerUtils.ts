import { ChainRow, PositionRow, ScannerCandidate } from './scannerTypes';

export function getMid(row: ChainRow) {
  if (typeof row.mark === 'number' && Number.isFinite(row.mark)) return row.mark;
  if (typeof row.bid === 'number' && typeof row.ask === 'number') return (row.bid + row.ask) / 2;
  if (typeof row.bid === 'number') return row.bid;
  if (typeof row.ask === 'number') return row.ask;
  return 0;
}

export function priceSpread(short: ChainRow, long: ChainRow, qty: number) {
  const shortVal = getMid(short) * qty * 100;
  const longVal = getMid(long) * qty * 100;
  return shortVal - longVal;
}

export function buildEntryCandidates(chain: ChainRow[], symbol: string): ScannerCandidate[] {
  const candidates: ScannerCandidate[] = [];
  const puts = chain.filter((row) => row.type === 'put').sort((a, b) => b.strike - a.strike);
  const calls = chain.filter((row) => row.type === 'call').sort((a, b) => a.strike - b.strike);

  for (let i = 0; i < puts.length - 1; i += 1) {
    const short = puts[i];
    const long = puts[i + 1];
    const credit = priceSpread(short, long, 1);
    const width = Math.abs(short.strike - long.strike);

    candidates.push({
      symbol,
      structure: `Put ${short.strike}/${long.strike}`,
      credit,
      debit: 0,
      net: credit,
      bpEffect: width * 100,
      score: width > 0 ? credit / width : credit,
    });
  }

  for (let i = 0; i < calls.length - 1; i += 1) {
    const short = calls[i];
    const long = calls[i + 1];
    const credit = priceSpread(short, long, 1);
    const width = Math.abs(short.strike - long.strike);

    candidates.push({
      symbol,
      structure: `Call ${short.strike}/${long.strike}`,
      credit,
      debit: 0,
      net: credit,
      bpEffect: width * 100,
      score: width > 0 ? credit / width : credit,
    });
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, 50);
}

export function buildRollCandidates(positions: PositionRow[], chain: ChainRow[], symbol: string): ScannerCandidate[] {
  const candidates: ScannerCandidate[] = [];

  positions
    .filter((position) => position.symbol === symbol)
    .forEach((position) => {
      chain
        .filter(
          (row) =>
            row.symbol === position.symbol &&
            row.type === position.type &&
            row.expiration !== position.expiration
        )
        .forEach((target) => {
          const closeVal = (position.mark || 0) * Math.abs(position.quantity) * 100;
          const openVal = getMid(target) * Math.abs(position.quantity) * 100;
          const net = openVal - closeVal;

          candidates.push({
            symbol,
            structure: `Roll ${position.expiration} ${position.strike} → ${target.expiration} ${target.strike}`,
            credit: net > 0 ? net : 0,
            debit: net < 0 ? Math.abs(net) : 0,
            net,
            bpEffect: 0,
            score: net,
          });
        });
    });

  return candidates.sort((a, b) => b.score - a.score).slice(0, 50);
}
