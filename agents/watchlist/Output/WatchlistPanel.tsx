import { Fragment, useMemo, useState } from 'react';
import MiniPriceChart from './watchlist/MiniPriceChart';
import { WATCHLIST_SEED_GROUPS } from './watchlist/watchlistSeed';
import { WatchlistGroup, WatchlistPanelProps, WatchlistTickerRow } from './watchlist/watchlistTypes';
import {
  COLLAPSED_COLUMNS,
  EXPANDED_COLUMNS,
  formatCompactVolume,
  formatPercent,
  formatPlainNumber,
  formatPrice,
  formatWhole,
  numberCellStyle,
  pctCellStyle,
  stringCellStyle,
} from './watchlist/watchlistUtils';

const shellStyle: React.CSSProperties = {
  height: '100%',
  minHeight: 0,
  display: 'grid',
  gridTemplateRows: '1fr 32%',
  background: '#060606',
  color: '#e5e7eb',
};

const topStyle: React.CSSProperties = {
  minHeight: 0,
  display: 'grid',
  gridTemplateRows: '22px 1fr',
};

const titleBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 8px',
  fontSize: 10,
  letterSpacing: '0.04em',
  color: '#8a94a6',
  borderBottom: '1px solid #0f0f0f',
};

const collapsedGridTemplate =
  '132px 86px 86px 72px 116px 132px 116px 132px';

const expandedGridTemplate =
  '132px 82px 86px 82px 70px 70px 70px 70px 70px 70px 70px 116px 132px 116px 132px 68px 74px 94px 74px 92px 104px 92px 92px';

const collapsedHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: collapsedGridTemplate,
  alignItems: 'center',
  padding: '0 8px',
  height: 22,
  fontSize: 10,
  fontWeight: 700,
  color: '#7c8798',
  borderBottom: '1px solid #0f0f0f',
  background: '#060606',
  position: 'sticky',
  top: 0,
  zIndex: 3,
};

const expandedHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: expandedGridTemplate,
  alignItems: 'center',
  padding: '0 8px',
  height: 22,
  fontSize: 10,
  fontWeight: 700,
  color: '#748093',
  borderTop: '1px solid #121212',
  borderBottom: '1px solid #121212',
  background: '#080808',
  position: 'sticky',
  top: 22,
  zIndex: 2,
};

const parentRowBaseStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: collapsedGridTemplate,
  alignItems: 'center',
  padding: '0 8px',
  height: 24,
  fontSize: 11,
  fontWeight: 700,
  borderBottom: '1px solid #111111',
  cursor: 'pointer',
};

const tickerRowBaseStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: expandedGridTemplate,
  alignItems: 'center',
  padding: '0 8px',
  height: 22,
  fontSize: 11,
  borderBottom: '1px solid #0d0d0d',
  cursor: 'pointer',
};

export default function WatchlistPanel({ onLaunchArtifact }: WatchlistPanelProps) {
  const groups = useMemo<WatchlistGroup[]>(() => WATCHLIST_SEED_GROUPS, []);
  const [expandedGroupKey, setExpandedGroupKey] = useState<WatchlistGroup['key'] | null>(
    groups[0]?.key ?? null
  );
  const [highlightedSymbol, setHighlightedSymbol] = useState<string | null>(null);

  const highlightedTicker = useMemo<WatchlistTickerRow | null>(() => {
    for (const group of groups) {
      const match = group.tickers.find((ticker) => ticker.symbol === highlightedSymbol);
      if (match) return match;
    }
    const expandedGroup = groups.find((group) => group.key === expandedGroupKey);
    return expandedGroup?.tickers[0] ?? null;
  }, [expandedGroupKey, groups, highlightedSymbol]);

  const chartSymbol = highlightedTicker?.symbol ?? null;

  return (
    <div style={shellStyle}>
      <div style={topStyle}>
        <div style={titleBarStyle}>
          <span>WATCHLIST OF WATCHLISTS</span>
          <span>{expandedGroupKey ?? '—'}</span>
        </div>

        <div style={{ minHeight: 0, overflow: 'auto' }}>
          <div style={collapsedHeaderStyle}>
            {COLLAPSED_COLUMNS.map((column) => (
              <div
                key={column}
                style={column === 'Symbol' ? { textAlign: 'left' } : { textAlign: 'right' }}
              >
                {column}
              </div>
            ))}
          </div>

          {groups.map((group) => {
            const isExpanded = group.key === expandedGroupKey;
            const summary = group.summary;

            return (
              <Fragment key={group.key}>
                <div
                  style={{
                    ...parentRowBaseStyle,
                    background: isExpanded ? '#101010' : '#0b0b0b',
                    color: isExpanded ? '#f3f4f6' : '#e5e7eb',
                  }}
                  onClick={() => {
                    setExpandedGroupKey(group.key);
                    if (group.tickers[0]) {
                      setHighlightedSymbol(group.tickers[0].symbol);
                    }
                  }}
                  title={`Expand ${group.label}`}
                >
                  <div style={stringCellStyle()}>
                    {isExpanded ? '▾ ' : '▸ '}
                    {summary.symbol}
                  </div>
                  <div style={numberCellStyle(summary.latest)}>{formatPrice(summary.latest)}</div>
                  <div style={pctCellStyle(summary.pctChange)}>{formatPercent(summary.pctChange)}</div>
                  <div style={numberCellStyle(summary.ivPctl)}>{formatWhole(summary.ivPctl)}</div>
                  <div style={{ ...numberCellStyle(1), textAlign: 'right' }}>{summary.upperEmFly}</div>
                  <div style={numberCellStyle(summary.upperEmCostExShorts)}>
                    {formatPrice(summary.upperEmCostExShorts)}
                  </div>
                  <div style={{ ...numberCellStyle(1), textAlign: 'right' }}>{summary.lowerEmFly}</div>
                  <div style={numberCellStyle(summary.lowerEmCostExShorts)}>
                    {formatPrice(summary.lowerEmCostExShorts)}
                  </div>
                </div>

                {isExpanded ? (
                  <>
                    <div style={expandedHeaderStyle}>
                      {EXPANDED_COLUMNS.map((column) => (
                        <div
                          key={`${group.key}-${column}`}
                          style={column === 'Symbol' ? { textAlign: 'left' } : { textAlign: 'right' }}
                        >
                          {column}
                        </div>
                      ))}
                    </div>

                    {group.tickers.map((ticker) => {
                      const isHighlighted = ticker.symbol === highlightedTicker?.symbol;

                      return (
                        <div
                          key={`${group.key}-${ticker.symbol}`}
                          style={{
                            ...tickerRowBaseStyle,
                            background: isHighlighted ? '#131313' : '#080808',
                          }}
                          onClick={() => setHighlightedSymbol(ticker.symbol)}
                          onDoubleClick={() =>
                            onLaunchArtifact?.({
                              symbol: ticker.symbol,
                              source: 'watchlist',
                              watchlistKey: group.key,
                            })
                          }
                          title={`${ticker.symbol} — single click highlights, double click launches Artifact`}
                        >
                          <div style={stringCellStyle()}>{ticker.symbol}</div>
                          <div style={numberCellStyle(ticker.latest)}>{formatPrice(ticker.latest)}</div>
                          <div style={pctCellStyle(ticker.pctChange)}>{formatPercent(ticker.pctChange)}</div>
                          <div style={numberCellStyle(ticker.relStr14d)}>
                            {formatPlainNumber(ticker.relStr14d)}
                          </div>
                          <div style={numberCellStyle(ticker.ivPctl)}>{formatWhole(ticker.ivPctl)}</div>
                          <div style={numberCellStyle(ticker.ivHv)}>{formatPlainNumber(ticker.ivHv, 2)}</div>
                          <div style={numberCellStyle(ticker.impVol)}>{formatPlainNumber(ticker.impVol)}</div>
                          <div style={numberCellStyle(ticker.iv5d)}>{formatPlainNumber(ticker.iv5d)}</div>
                          <div style={numberCellStyle(ticker.iv1m)}>{formatPlainNumber(ticker.iv1m)}</div>
                          <div style={numberCellStyle(ticker.iv3m)}>{formatPlainNumber(ticker.iv3m)}</div>
                          <div style={numberCellStyle(ticker.iv6m)}>{formatPlainNumber(ticker.iv6m)}</div>
                          <div style={{ ...numberCellStyle(1), textAlign: 'right' }}>{ticker.upperEmFly}</div>
                          <div style={numberCellStyle(ticker.upperEmCostExShorts)}>
                            {formatPrice(ticker.upperEmCostExShorts)}
                          </div>
                          <div style={{ ...numberCellStyle(1), textAlign: 'right' }}>{ticker.lowerEmFly}</div>
                          <div style={numberCellStyle(ticker.lowerEmCostExShorts)}>
                            {formatPrice(ticker.lowerEmCostExShorts)}
                          </div>
                          <div style={numberCellStyle(ticker.bbPct)}>{formatPlainNumber(ticker.bbPct)}</div>
                          <div style={numberCellStyle(ticker.bbRank)}>{formatPlainNumber(ticker.bbRank)}</div>
                          <div style={{ ...stringCellStyle(), textAlign: 'right', color: '#cbd5e1' }}>
                            {ticker.ttmSqueeze}
                          </div>
                          <div style={numberCellStyle(ticker.adr14d)}>{formatPlainNumber(ticker.adr14d, 2)}</div>
                          <div style={numberCellStyle(ticker.optionsVol)}>
                            {formatCompactVolume(ticker.optionsVol)}
                          </div>
                          <div style={numberCellStyle(ticker.totalVol1m)}>
                            {formatCompactVolume(ticker.totalVol1m)}
                          </div>
                          <div style={numberCellStyle(ticker.callVol)}>
                            {formatCompactVolume(ticker.callVol)}
                          </div>
                          <div style={numberCellStyle(ticker.putVol)}>
                            {formatCompactVolume(ticker.putVol)}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : null}
              </Fragment>
            );
          })}
        </div>
      </div>

      <div style={{ minHeight: 0 }}>
        <MiniPriceChart symbol={chartSymbol} />
      </div>
    </div>
  );
}