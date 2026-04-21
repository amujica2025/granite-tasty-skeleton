export type WatchlistGroupKey =
  | 'WEEKLYS'
  | 'XLC'
  | 'XLY'
  | 'XLP'
  | 'XLE'
  | 'XLF'
  | 'XLV'
  | 'XLI'
  | 'XLK'
  | 'XLB'
  | 'XLRE'
  | 'XLU';

export type TtmSqueezeState = 'On' | 'Off' | 'Neutral';

export type WatchlistTickerRow = {
  symbol: string;
  latest: number;
  pctChange: number;
  relStr14d: number;
  ivPctl: number;
  ivHv: number;
  impVol: number;
  iv5d: number;
  iv1m: number;
  iv3m: number;
  iv6m: number;
  upperEmFly: string;
  upperEmCostExShorts: number;
  lowerEmFly: string;
  lowerEmCostExShorts: number;
  bbPct: number;
  bbRank: number;
  ttmSqueeze: TtmSqueezeState;
  adr14d: number;
  optionsVol: number;
  totalVol1m: number;
  callVol: number;
  putVol: number;
};

export type WatchlistParentSummaryRow = {
  symbol: string;
  latest: number;
  pctChange: number;
  ivPctl: number;
  upperEmFly: string;
  upperEmCostExShorts: number;
  lowerEmFly: string;
  lowerEmCostExShorts: number;
};

export type WatchlistGroup = {
  key: WatchlistGroupKey;
  label: string;
  tickers: WatchlistTickerRow[];
  summary: WatchlistParentSummaryRow;
};

export type WatchlistCsvSeedMap = Record<WatchlistGroupKey, string>;

export type ArtifactLaunchPayload = {
  symbol: string;
  source: 'watchlist';
  watchlistKey: WatchlistGroupKey;
};

export type LiveQuoteRow = {
  symbol: string;
  latest: number;
  pctChange: number;
};

export type WatchlistPanelProps = {
  onLaunchArtifact?: (payload: ArtifactLaunchPayload) => void;
  quoteRows?: LiveQuoteRow[];
};
