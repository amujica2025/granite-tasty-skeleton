import type * as React from 'react';
import { WatchlistGroup, WatchlistGroupKey, WatchlistParentSummaryRow, WatchlistTickerRow } from './watchlistTypes';

export const TOP_LEVEL_WATCHLIST_ORDER: WatchlistGroupKey[] = [
  'WEEKLYS',
  'XLC',
  'XLY',
  'XLP',
  'XLE',
  'XLF',
  'XLV',
  'XLI',
  'XLK',
  'XLB',
  'XLRE',
  'XLU',
];

export const TOP_LEVEL_WATCHLIST_LABELS: Record<WatchlistGroupKey, string> = {
  WEEKLYS: 'Weeklys',
  XLC: 'XLC',
  XLY: 'XLY',
  XLP: 'XLP',
  XLE: 'XLE',
  XLF: 'XLF',
  XLV: 'XLV',
  XLI: 'XLI',
  XLK: 'XLK',
  XLB: 'XLB',
  XLRE: 'XLRE',
  XLU: 'XLU',
};

const EXCLUDED_SYMBOLS = new Set(['SPX', 'NDX', 'RUT']);

const HEADER_TOKENS = new Set([
  'SYMBOL',
  'SYMBOLS',
  'TICKER',
  'TICKERS',
  'NAME',
  'NAMES',
  'COMPANY',
  'COMPANY NAME',
  'SECURITY',
  'SECURITY NAME',
  'DESCRIPTION',
  'WEIGHT',
  'SECTOR',
  'INDUSTRY',
  'CUSIP',
  'ISIN',
  'SEDOL',
  'MARKET CAP',
  'MARKETCAP',
  'SHARES',
  'PRICE',
  'LAST',
  'CHANGE',
  '%CHANGE',
  'PERCENT CHANGE',
]);

export const COLLAPSED_COLUMNS = [
  'Symbol',
  'Latest',
  '%Change',
  'IV Pctl',
  'Upper EM Fly',
  'Upper EM Cost (ex shorts)',
  'Lower EM Fly',
  'Lower EM Cost (ex shorts)',
] as const;

export const EXPANDED_COLUMNS = [
  'Symbol',
  'Latest',
  '%Change',
  '14D Rel Str',
  'IV Pctl',
  'IV/HV',
  'Imp Vol',
  '5D IV',
  '1M IV',
  '3M IV',
  '6M IV',
  'Upper EM Fly',
  'Upper EM Cost (ex shorts)',
  'Lower EM Fly',
  'Lower EM Cost (ex shorts)',
  'BB%',
  'BB Rank',
  'TTM Squeeze',
  '14D ADR',
  'Options Vol',
  '1M Total Vol',
  'Call Volume',
  'Put Volume',
] as const;

export function formatPrice(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : '—';
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatPlainNumber(value: number, decimals = 1): string {
  return Number.isFinite(value) ? value.toFixed(decimals) : '—';
}

export function formatWhole(value: number): string {
  return Number.isFinite(value) ? value.toFixed(0) : '—';
}

export function formatCompactVolume(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function numberCellStyle(value: number): React.CSSProperties {
  return {
    textAlign: 'right',
    color: !Number.isFinite(value) ? '#5b6472' : '#d1d5db',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  };
}

export function pctCellStyle(value: number): React.CSSProperties {
  return {
    textAlign: 'right',
    color: value > 0 ? '#22c55e' : value < 0 ? '#ef4444' : '#d1d5db',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  };
}

export function stringCellStyle(): React.CSSProperties {
  return {
    textAlign: 'left',
    color: '#e5e7eb',
    whiteSpace: 'nowrap',
  };
}

export function parseMembershipCsv(rawCsv: string): string[] {
  if (!rawCsv.trim()) return [];

  const lines = rawCsv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const symbols: string[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];

    const cells = line
      .split(',')
      .map((cell) => cell.replace(/^"|"$/g, '').trim())
      .filter(Boolean);

    if (cells.length === 0) continue;
    if (isExplicitHeaderRow(cells)) continue;

    const symbol = extractTickerFromRow(cells);
    if (!symbol) continue;
    if (EXCLUDED_SYMBOLS.has(symbol)) continue;

    symbols.push(symbol);
  }

  return Array.from(new Set(symbols));
}

export function buildTickerRow(symbol: string): WatchlistTickerRow {
  const hash = hashSymbol(symbol);
  const latest = round2(40 + (hash % 900) + ((hash % 37) / 37));
  const pctChange = round2(((hash % 401) - 200) / 100);
  const impVol = round1(12 + (hash % 550) / 10);
  const iv5d = round1(Math.max(8, impVol - 1.5 + ((hash % 30) / 10)));
  const iv1m = round1(Math.max(8, impVol - 0.8 + ((hash % 28) / 10)));
  const iv3m = round1(Math.max(8, impVol + ((hash % 24) / 10)));
  const iv6m = round1(Math.max(8, impVol + 1.1 + ((hash % 22) / 10)));
  const upperStrike = roundStrike(latest * 1.06);
  const lowerStrike = roundStrike(latest * 0.94);

  return {
    symbol,
    latest,
    pctChange,
    relStr14d: round1((hash % 1000) / 10),
    ivPctl: round1((hash % 1000) / 10),
    ivHv: round2(0.7 + ((hash % 90) / 100)),
    impVol,
    iv5d,
    iv1m,
    iv3m,
    iv6m,
    upperEmFly: `${upperStrike}C fly`,
    upperEmCostExShorts: round2(0.4 + ((hash % 240) / 100)),
    lowerEmFly: `${lowerStrike}P fly`,
    lowerEmCostExShorts: round2(0.4 + (((hash + 71) % 240) / 100)),
    bbPct: round1((hash % 1000) / 10),
    bbRank: round1(((hash + 127) % 1000) / 10),
    ttmSqueeze: (hash % 3) === 0 ? 'On' : (hash % 3) === 1 ? 'Off' : 'Neutral',
    adr14d: round2(0.8 + ((hash % 180) / 20)),
    optionsVol: 25000 + (hash % 2500000),
    totalVol1m: 200000 + (hash % 15000000),
    callVol: 10000 + (hash % 1500000),
    putVol: 10000 + ((hash * 7) % 1500000),
  };
}

export function buildParentSummaryRow(
  label: string,
  tickers: WatchlistTickerRow[]
): WatchlistParentSummaryRow {
  if (tickers.length === 0) {
    return {
      symbol: label,
      latest: Number.NaN,
      pctChange: Number.NaN,
      ivPctl: Number.NaN,
      upperEmFly: '—',
      upperEmCostExShorts: Number.NaN,
      lowerEmFly: '—',
      lowerEmCostExShorts: Number.NaN,
    };
  }

  const avg = <K extends keyof WatchlistTickerRow>(key: K): number => {
    const nums = tickers
      .map((row) => row[key])
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    if (nums.length === 0) return Number.NaN;
    return nums.reduce((sum, value) => sum + value, 0) / nums.length;
  };

  const representative = tickers[0];

  return {
    symbol: label,
    latest: avg('latest'),
    pctChange: avg('pctChange'),
    ivPctl: avg('ivPctl'),
    upperEmFly: representative.upperEmFly,
    upperEmCostExShorts: avg('upperEmCostExShorts'),
    lowerEmFly: representative.lowerEmFly,
    lowerEmCostExShorts: avg('lowerEmCostExShorts'),
  };
}

export function buildGroupsFromMemberships(
  memberships: Record<WatchlistGroupKey, string[]>
): WatchlistGroup[] {
  return TOP_LEVEL_WATCHLIST_ORDER.map((key) => {
    const symbols = memberships[key] ?? [];
    const tickers = symbols.map(buildTickerRow);
    return {
      key,
      label: TOP_LEVEL_WATCHLIST_LABELS[key],
      tickers,
      summary: buildParentSummaryRow(TOP_LEVEL_WATCHLIST_LABELS[key], tickers),
    };
  });
}

function extractTickerFromRow(cells: string[]): string | null {
  for (const rawCell of cells) {
    const cleaned = normalizeCell(rawCell);
    if (!cleaned) continue;
    if (HEADER_TOKENS.has(cleaned)) continue;
    if (!isLikelyTicker(cleaned)) continue;
    return cleaned;
  }
  return null;
}

function isExplicitHeaderRow(cells: string[]): boolean {
  const normalized = cells.map(normalizeCell).filter(Boolean);
  if (normalized.length === 0) return false;

  const headerMatches = normalized.filter((cell) => HEADER_TOKENS.has(cell)).length;
  if (headerMatches >= 1) return true;
  if (normalized.every((cell) => !isLikelyTicker(cell))) return true;

  return false;
}

function isLikelyTicker(value: string): boolean {
  if (!value) return false;
  if (value.length > 8) return false;
  if (!/^[A-Z][A-Z0-9.\-]*$/.test(value)) return false;
  if (HEADER_TOKENS.has(value)) return false;
  return true;
}

function normalizeCell(value: string): string {
  return value
    .trim()
    .replace(/^"|"$/g, '')
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function hashSymbol(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i += 1) {
    hash = (hash * 31 + symbol.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundStrike(value: number): number {
  if (value >= 500) return Math.round(value / 5) * 5;
  if (value >= 200) return Math.round(value / 2.5) * 2.5;
  return Math.round(value);
}