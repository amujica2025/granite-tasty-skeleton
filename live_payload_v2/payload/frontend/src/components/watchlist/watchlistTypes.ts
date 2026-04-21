export type WatchlistTickerRow = { symbol: string; latest: number; pctChange: number };
export type ArtifactLaunchPayload = { symbol: string; source: 'watchlist'; watchlistKey: string };
export type WatchlistPanelProps = { onLaunchArtifact?: (payload: ArtifactLaunchPayload) => void; };
