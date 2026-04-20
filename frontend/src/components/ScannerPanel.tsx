import { useMemo, useState } from 'react';

type ScannerMode = 'entry' | 'roll';
type CandidateSide = 'call' | 'put' | 'mixed';
type CandidateType = 'entry' | 'roll';

type ScannerCandidate = {
  candidate_id: string;
  candidate_type: CandidateType;
  underlying: string;
  expiration: string;
  structure: string;
  side: CandidateSide;
  legs: Array<Record<string, unknown>>;
  net_credit: number;
  defined_risk: number;
  actual_defined_risk: number;
  credit_pct_risk: number;
  limit_impact: number;
  score: number;
};

type SortField =
  | 'underlying'
  | 'expiration'
  | 'structure'
  | 'side'
  | 'net_credit'
  | 'defined_risk'
  | 'credit_pct_risk'
  | 'limit_impact'
  | 'score';

type SortDirection = 'asc' | 'desc';

const entryCandidates: ScannerCandidate[] = [
  {
    candidate_id: 'entry-spy-2026-04-24-put-1',
    candidate_type: 'entry',
    underlying: 'SPY',
    expiration: '2026-04-24',
    structure: 'Put Credit Spread 5w',
    side: 'put',
    legs: [],
    net_credit: 1.62,
    defined_risk: 5.0,
    actual_defined_risk: 5.0,
    credit_pct_risk: 32.4,
    limit_impact: 162,
    score: 93.2,
  },
  {
    candidate_id: 'entry-spy-2026-04-24-call-1',
    candidate_type: 'entry',
    underlying: 'SPY',
    expiration: '2026-04-24',
    structure: 'Call Credit Spread 5w',
    side: 'call',
    legs: [],
    net_credit: 1.48,
    defined_risk: 5.0,
    actual_defined_risk: 5.0,
    credit_pct_risk: 29.6,
    limit_impact: 148,
    score: 88.6,
  },
  {
    candidate_id: 'entry-qqq-2026-04-24-iron-1',
    candidate_type: 'entry',
    underlying: 'QQQ',
    expiration: '2026-04-24',
    structure: 'Iron Condor 2.5w',
    side: 'mixed',
    legs: [],
    net_credit: 0.88,
    defined_risk: 2.5,
    actual_defined_risk: 2.5,
    credit_pct_risk: 35.2,
    limit_impact: 88,
    score: 91.1,
  },
  {
    candidate_id: 'entry-iwm-2026-04-24-put-1',
    candidate_type: 'entry',
    underlying: 'IWM',
    expiration: '2026-04-24',
    structure: 'Put Credit Spread 2.5w',
    side: 'put',
    legs: [],
    net_credit: 0.81,
    defined_risk: 2.5,
    actual_defined_risk: 2.5,
    credit_pct_risk: 32.4,
    limit_impact: 81,
    score: 86.9,
  },
  {
    candidate_id: 'entry-tsla-2026-04-24-call-1',
    candidate_type: 'entry',
    underlying: 'TSLA',
    expiration: '2026-04-24',
    structure: 'Call Credit Spread 10w',
    side: 'call',
    legs: [],
    net_credit: 2.86,
    defined_risk: 10.0,
    actual_defined_risk: 10.0,
    credit_pct_risk: 28.6,
    limit_impact: 286,
    score: 84.7,
  },
  {
    candidate_id: 'entry-nvda-2026-04-24-iron-1',
    candidate_type: 'entry',
    underlying: 'NVDA',
    expiration: '2026-04-24',
    structure: 'Iron Fly 5w',
    side: 'mixed',
    legs: [],
    net_credit: 1.79,
    defined_risk: 5.0,
    actual_defined_risk: 5.0,
    credit_pct_risk: 35.8,
    limit_impact: 179,
    score: 95.4,
  },
  {
    candidate_id: 'entry-spx-2026-04-24-put-1',
    candidate_type: 'entry',
    underlying: 'SPX',
    expiration: '2026-04-24',
    structure: 'Put Credit Spread 10w',
    side: 'put',
    legs: [],
    net_credit: 3.18,
    defined_risk: 10.0,
    actual_defined_risk: 10.0,
    credit_pct_risk: 31.8,
    limit_impact: 318,
    score: 90.3,
  },
];

const rollCandidates: ScannerCandidate[] = [
  {
    candidate_id: 'roll-spy-2026-04-27-put-1',
    candidate_type: 'roll',
    underlying: 'SPY',
    expiration: '2026-04-27',
    structure: 'Roll Put Credit Spread 1w',
    side: 'put',
    legs: [],
    net_credit: 0.24,
    defined_risk: 5.0,
    actual_defined_risk: 5.0,
    credit_pct_risk: 4.8,
    limit_impact: 24,
    score: 78.4,
  },
  {
    candidate_id: 'roll-spy-2026-04-29-call-1',
    candidate_type: 'roll',
    underlying: 'SPY',
    expiration: '2026-04-29',
    structure: 'Roll Call Credit Spread 5w',
    side: 'call',
    legs: [],
    net_credit: 0.39,
    defined_risk: 5.0,
    actual_defined_risk: 5.0,
    credit_pct_risk: 7.8,
    limit_impact: 39,
    score: 83.9,
  },
  {
    candidate_id: 'roll-qqq-2026-04-29-mixed-1',
    candidate_type: 'roll',
    underlying: 'QQQ',
    expiration: '2026-04-29',
    structure: 'Roll Iron Condor 2.5w',
    side: 'mixed',
    legs: [],
    net_credit: 0.31,
    defined_risk: 2.5,
    actual_defined_risk: 2.5,
    credit_pct_risk: 12.4,
    limit_impact: 31,
    score: 89.2,
  },
  {
    candidate_id: 'roll-iwm-2026-05-01-put-1',
    candidate_type: 'roll',
    underlying: 'IWM',
    expiration: '2026-05-01',
    structure: 'Roll Put Credit Spread 2.5w',
    side: 'put',
    legs: [],
    net_credit: 0.27,
    defined_risk: 2.5,
    actual_defined_risk: 2.5,
    credit_pct_risk: 10.8,
    limit_impact: 27,
    score: 85.1,
  },
  {
    candidate_id: 'roll-tsla-2026-05-01-call-1',
    candidate_type: 'roll',
    underlying: 'TSLA',
    expiration: '2026-05-01',
    structure: 'Roll Call Credit Spread 10w',
    side: 'call',
    legs: [],
    net_credit: 0.72,
    defined_risk: 10.0,
    actual_defined_risk: 10.0,
    credit_pct_risk: 7.2,
    limit_impact: 72,
    score: 81.6,
  },
  {
    candidate_id: 'roll-nvda-2026-05-01-mixed-1',
    candidate_type: 'roll',
    underlying: 'NVDA',
    expiration: '2026-05-01',
    structure: 'Roll Iron Fly 5w',
    side: 'mixed',
    legs: [],
    net_credit: 0.58,
    defined_risk: 5.0,
    actual_defined_risk: 5.0,
    credit_pct_risk: 11.6,
    limit_impact: 58,
    score: 90.8,
  },
];

const expirations = ['All', '2026-04-24', '2026-04-27', '2026-04-29', '2026-05-01'];
const riskBuckets = ['All', '2.5', '5.0', '10.0'];

const headerButtonStyle: React.CSSProperties = {
  width: '100%',
  border: 0,
  background: 'transparent',
  color: '#bdb08a',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.03em',
  textAlign: 'inherit',
  padding: 0,
  cursor: 'pointer',
};

const thBaseStyle: React.CSSProperties = {
  padding: '5px 6px',
  borderBottom: '1px solid #5f5531',
  background: '#d7c26b',
  position: 'sticky',
  top: 0,
  zIndex: 2,
  whiteSpace: 'nowrap',
};

const tdBaseStyle: React.CSSProperties = {
  padding: '4px 6px',
  borderBottom: '1px solid rgba(73, 60, 24, 0.35)',
  whiteSpace: 'nowrap',
  color: '#2d2408',
  fontSize: 11,
};

function formatMoney(value: number) {
  return `$${value.toFixed(2)}`;
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function sortArrow(active: boolean, direction: SortDirection) {
  if (!active) return '';
  return direction === 'asc' ? ' ▲' : ' ▼';
}

export default function ScannerPanel() {
  const [mode, setMode] = useState<ScannerMode>('entry');
  const [sideFilter, setSideFilter] = useState<'all' | CandidateSide>('all');
  const [expirationFilter, setExpirationFilter] = useState<string>('All');
  const [riskBucketFilter, setRiskBucketFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('credit_pct_risk');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sourceRows = mode === 'entry' ? entryCandidates : rollCandidates;

  const filteredRows = useMemo(() => {
    return sourceRows.filter((row) => {
      const sideOk = sideFilter === 'all' ? true : row.side === sideFilter;
      const expirationOk = expirationFilter === 'All' ? true : row.expiration === expirationFilter;
      const riskOk = riskBucketFilter === 'All'
        ? true
        : row.defined_risk.toFixed(1) === Number(riskBucketFilter).toFixed(1);

      return sideOk && expirationOk && riskOk;
    });
  }, [sourceRows, sideFilter, expirationFilter, riskBucketFilter]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];

    rows.sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;

      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * multiplier;
      }

      return String(aValue).localeCompare(String(bValue)) * multiplier;
    });

    return rows;
  }, [filteredRows, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortField(field);
    setSortDirection(field === 'underlying' || field === 'expiration' || field === 'structure' || field === 'side' ? 'asc' : 'desc');
  };

  return (
    <div
      style={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.18)',
        border: '1px solid rgba(0,0,0,0.15)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '6px 8px',
          borderBottom: '1px solid rgba(73, 60, 24, 0.35)',
          color: '#3b3212',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>
          {mode === 'entry' ? 'ENTRY SCANNER' : 'ROLL SCANNER'}
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setMode('entry')}
            style={{
              border: '1px solid rgba(0,0,0,0.25)',
              background: mode === 'entry' ? '#3b3212' : 'rgba(255,255,255,0.35)',
              color: mode === 'entry' ? '#f1e3ab' : '#241d06',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 6px',
              cursor: 'pointer',
            }}
          >
            ENTRY
          </button>
          <button
            onClick={() => setMode('roll')}
            style={{
              border: '1px solid rgba(0,0,0,0.25)',
              background: mode === 'roll' ? '#3b3212' : 'rgba(255,255,255,0.35)',
              color: mode === 'roll' ? '#f1e3ab' : '#241d06',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 6px',
              cursor: 'pointer',
            }}
          >
            ROLL
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr auto',
          gap: 6,
          padding: '6px 8px',
          borderBottom: '1px solid rgba(73, 60, 24, 0.35)',
          background: 'rgba(255,255,255,0.08)',
          alignItems: 'end',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#4a3f17', letterSpacing: '0.04em' }}>SIDE</span>
          <select
            value={sideFilter}
            onChange={(e) => setSideFilter(e.target.value as 'all' | CandidateSide)}
            style={{
              height: 22,
              border: '1px solid rgba(0,0,0,0.22)',
              background: '#efe1a8',
              color: '#2d2408',
              fontSize: 10,
            }}
          >
            <option value="all">All</option>
            <option value="call">Call</option>
            <option value="put">Put</option>
            <option value="mixed">Mixed</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#4a3f17', letterSpacing: '0.04em' }}>EXP</span>
          <select
            value={expirationFilter}
            onChange={(e) => setExpirationFilter(e.target.value)}
            style={{
              height: 22,
              border: '1px solid rgba(0,0,0,0.22)',
              background: '#efe1a8',
              color: '#2d2408',
              fontSize: 10,
            }}
          >
            {expirations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#4a3f17', letterSpacing: '0.04em' }}>RISK</span>
          <select
            value={riskBucketFilter}
            onChange={(e) => setRiskBucketFilter(e.target.value)}
            style={{
              height: 22,
              border: '1px solid rgba(0,0,0,0.22)',
              background: '#efe1a8',
              color: '#2d2408',
              fontSize: 10,
            }}
          >
            {riskBuckets.map((item) => (
              <option key={item} value={item}>
                {item === 'All' ? item : `${item}w`}
              </option>
            ))}
          </select>
        </label>

        <div
          style={{
            alignSelf: 'center',
            fontSize: 10,
            fontWeight: 700,
            color: '#4a3f17',
            textAlign: 'right',
            whiteSpace: 'nowrap',
          }}
        >
          {sortedRows.length} rows
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: 760,
          }}
        >
          <thead>
            <tr>
              <th style={{ ...thBaseStyle, textAlign: 'left' }}>
                <button type="button" onClick={() => handleSort('underlying')} style={headerButtonStyle}>
                  SYMBOL{sortArrow(sortField === 'underlying', sortDirection)}
                </button>
              </th>
              <th style={{ ...thBaseStyle, textAlign: 'left' }}>
                <button type="button" onClick={() => handleSort('expiration')} style={headerButtonStyle}>
                  EXP{sortArrow(sortField === 'expiration', sortDirection)}
                </button>
              </th>
              <th style={{ ...thBaseStyle, textAlign: 'left' }}>
                <button type="button" onClick={() => handleSort('structure')} style={headerButtonStyle}>
                  STRUCTURE{sortArrow(sortField === 'structure', sortDirection)}
                </button>
              </th>
              <th style={{ ...thBaseStyle, textAlign: 'left' }}>
                <button type="button" onClick={() => handleSort('side')} style={headerButtonStyle}>
                  SIDE{sortArrow(sortField === 'side', sortDirection)}
                </button>
              </th>
              <th style={{ ...thBaseStyle, textAlign: 'right' }}>
                <button type="button" onClick={() => handleSort('net_credit')} style={headerButtonStyle}>
                  CREDIT{sortArrow(sortField === 'net_credit', sortDirection)}
                </button>
              </th>
              <th style={{ ...thBaseStyle, textAlign: 'right' }}>
                <button type="button" onClick={() => handleSort('defined_risk')} style={headerButtonStyle}>
                  RISK{sortArrow(sortField === 'defined_risk', sortDirection)}
                </button>
              </th>
              <th style={{ ...thBaseStyle, textAlign: 'right' }}>
                <button type="button" onClick={() => handleSort('credit_pct_risk')} style={headerButtonStyle}>
                  % RISK{sortArrow(sortField === 'credit_pct_risk', sortDirection)}
                </button>
              </th>
              <th style={{ ...thBaseStyle, textAlign: 'right' }}>
                <button type="button" onClick={() => handleSort('limit_impact')} style={headerButtonStyle}>
                  LIMIT{sortArrow(sortField === 'limit_impact', sortDirection)}
                </button>
              </th>
              <th style={{ ...thBaseStyle, textAlign: 'right' }}>
                <button type="button" onClick={() => handleSort('score')} style={headerButtonStyle}>
                  SCORE{sortArrow(sortField === 'score', sortDirection)}
                </button>
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedRows.map((row) => (
              <tr
                key={row.candidate_id}
                style={{
                  background: 'transparent',
                }}
              >
                <td style={{ ...tdBaseStyle, fontWeight: 700 }}>{row.underlying}</td>
                <td style={tdBaseStyle}>{row.expiration}</td>
                <td style={tdBaseStyle}>{row.structure}</td>
                <td style={{ ...tdBaseStyle, textTransform: 'uppercase' }}>{row.side}</td>
                <td style={{ ...tdBaseStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {formatMoney(row.net_credit)}
                </td>
                <td style={{ ...tdBaseStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {formatMoney(row.defined_risk)}
                </td>
                <td
                  style={{
                    ...tdBaseStyle,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    color: row.credit_pct_risk >= 30 ? '#2f5a1d' : '#5a2f1d',
                    fontWeight: 700,
                  }}
                >
                  {formatPercent(row.credit_pct_risk)}
                </td>
                <td style={{ ...tdBaseStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  ${row.limit_impact.toFixed(0)}
                </td>
                <td style={{ ...tdBaseStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                  {row.score.toFixed(1)}
                </td>
              </tr>
            ))}

            {sortedRows.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    ...tdBaseStyle,
                    textAlign: 'center',
                    padding: '14px 8px',
                    color: '#5b4d1b',
                    fontWeight: 700,
                  }}
                >
                  No candidates match the current filter set.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          padding: '5px 8px',
          borderTop: '1px solid rgba(73, 60, 24, 0.35)',
          background: 'rgba(255,255,255,0.08)',
          fontSize: 9,
          color: '#5b4d1b',
          letterSpacing: '0.02em',
        }}
      >
        MOCK UI SHELL ONLY — ranking, sorting, and layout scaffold preserved for later live scan wiring.
      </div>
    </div>
  );
}