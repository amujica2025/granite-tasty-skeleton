import { useEffect, useState } from 'react';
import PositionsPanel from './components/PositionsPanel';

function App() {
  const [netLiq, setNetLiq] = useState<number | null>(null);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/balances');
        const data = await res.json();

        if (data.balances && data.balances.length > 0) {
          const value = data.balances[0].net_liquidating_value;
          setNetLiq(value);
          console.log('✅ Net Liq updated from API:', value);
        }
      } catch (e) {
        console.error('Failed to fetch balances:', e);
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/market');

    ws.onopen = () => console.log('✅ Market WS connected');

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'RawFeed' && msg.data && msg.data.type === 'FEED_DATA') {
          const feed = msg.data.data;

          if (feed[0] === 'Quote') {
            const values = feed[1];
            for (let i = 0; i < values.length; i += 5) {
              const symbol = values[i];
              console.log(`📊 Updated ${symbol}`);
            }
          }
        }
      } catch (e) {
        console.log('❌ Quote parse error');
      }
    };

    ws.onclose = () => console.log('⚠️ Market WS closed');
    ws.onerror = () => console.log('❌ Market WS error');

    return () => ws.close();
  }, []);

  const shellStyle: React.CSSProperties = {
    background: '#0a0a0a',
    color: '#ffffff',
    minHeight: '100vh',
    height: '100vh',
    padding: '10px',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, sans-serif',
    overflow: 'hidden',
  };

  const appGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '92px minmax(520px, 1.15fr) minmax(980px, 1.9fr) 330px',
    gridTemplateRows: '74px 110px minmax(0, 1fr)',
    gap: '10px',
    height: '100%',
    width: '100%',
  };

  const panelStyle: React.CSSProperties = {
    background: '#171717',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '12px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#8d8d8d',
    marginBottom: '8px',
  };

  const kpiCardStyle: React.CSSProperties = {
    background: '#111111',
    border: '1px solid #2b2b2b',
    borderRadius: '10px',
    padding: '10px 12px',
    minWidth: '140px',
  };

  const ribbonBoxStyle: React.CSSProperties = {
    minWidth: '150px',
    background: '#121212',
    border: '1px solid #2b2b2b',
    borderRadius: '10px',
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  };

  return (
    <div style={shellStyle}>
      <div style={appGridStyle}>
        {/* LEFT RAIL */}
        <div
          style={{
            ...panelStyle,
            gridColumn: '1 / 2',
            gridRow: '1 / 4',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px 8px',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '42px',
              borderRadius: '10px',
              background: '#101010',
              border: '1px solid #2b2b2b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              color: '#9a9a9a',
            }}
          >
            WL
          </div>

          <div
            style={{
              width: '100%',
              flex: 1,
              borderRadius: '10px',
              background: '#101010',
              border: '1px solid #222',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              fontSize: '11px',
              color: '#727272',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Watchlist Rail
          </div>
        </div>

        {/* CHART PANEL */}
        <div
          style={{
            ...panelStyle,
            gridColumn: '2 / 3',
            gridRow: '1 / 4',
            display: 'flex',
            flexDirection: 'column',
            padding: '12px',
          }}
        >
          <div style={titleStyle}>Charting</div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '10px',
            }}
          >
            {['Symbol', 'Timeframe', 'Studies', 'EM'].map((item) => (
              <div
                key={item}
                style={{
                  flex: 1,
                  background: '#101010',
                  border: '1px solid #252525',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  fontSize: '12px',
                  color: '#8d8d8d',
                }}
              >
                {item}
              </div>
            ))}
          </div>

          <div
            style={{
              flex: 1,
              background:
                'linear-gradient(180deg, rgba(20,20,20,1) 0%, rgba(12,12,12,1) 100%)',
              border: '1px solid #232323',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#5f5f5f',
              fontSize: '14px',
            }}
          >
            Main Chart Area
          </div>
        </div>

        {/* TOP COMMAND BAR OVER HERO */}
        <div
          style={{
            ...panelStyle,
            gridColumn: '3 / 5',
            gridRow: '1 / 2',
            display: 'grid',
            gridTemplateColumns: '1.1fr 0.9fr',
            gap: '10px',
            padding: '10px',
          }}
        >
          {/* UNDERLYING RIBBON */}
          <div
            style={{
              background: '#111111',
              border: '1px solid #272727',
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              overflowX: 'auto',
            }}
          >
            {['SPY', 'AAPL', 'QQQ', 'TSLA', 'NVDA', 'XLE'].map((sym) => (
              <div key={sym} style={ribbonBoxStyle}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    fontSize: '11px',
                  }}
                >
                  <span style={{ color: '#f2f2f2', fontWeight: 600 }}>{sym}</span>
                  <span style={{ color: '#22c55e' }}>+0.42%</span>
                </div>

                <div
                  style={{
                    height: '28px',
                    borderRadius: '6px',
                    background:
                      'linear-gradient(180deg, rgba(26,26,26,1) 0%, rgba(18,18,18,1) 100%)',
                    border: '1px solid #252525',
                    position: 'relative',
                    marginBottom: '6px',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      right: '8px',
                      height: '1px',
                      background: 'rgba(245, 158, 11, 0.8)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      right: '8px',
                      height: '1px',
                      background: 'rgba(245, 158, 11, 0.8)',
                    }}
                  />
                </div>

                <div style={{ fontSize: '10px', color: '#8b8b8b' }}>
                  Weekly EM ribbon placeholder
                </div>
              </div>
            ))}
          </div>

          {/* KPI AREA */}
          <div
            style={{
              background: '#111111',
              border: '1px solid #272727',
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '8px',
              overflowX: 'auto',
            }}
          >
            <div style={kpiCardStyle}>
              <div style={titleStyle}>Net Liq</div>
              <div
                style={{
                  fontSize: '28px',
                  lineHeight: 1.1,
                  color: '#22c55e',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                ${netLiq !== null ? netLiq.toLocaleString() : '...'}
              </div>
            </div>

            <div style={kpiCardStyle}>
              <div style={titleStyle}>25x NLV</div>
              <div
                style={{
                  fontSize: '22px',
                  color: '#e5e5e5',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                $
                {netLiq !== null
                  ? (netLiq * 25).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })
                  : '...'}
              </div>
            </div>

            <div style={kpiCardStyle}>
              <div style={titleStyle}>BP Effect</div>
              <div
                style={{
                  fontSize: '22px',
                  color: '#f59e0b',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                $0
              </div>
            </div>

            <div style={kpiCardStyle}>
              <div style={titleStyle}>Long Value</div>
              <div
                style={{
                  fontSize: '20px',
                  color: '#d4d4d4',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                $0
              </div>
            </div>

            <div style={kpiCardStyle}>
              <div style={titleStyle}>Short Value</div>
              <div
                style={{
                  fontSize: '20px',
                  color: '#d4d4d4',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                $0
              </div>
            </div>
          </div>
        </div>

        {/* HERO POSITIONS PANEL */}
        <div
          style={{
            ...panelStyle,
            gridColumn: '3 / 4',
            gridRow: '2 / 4',
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderBottom: '1px solid #262626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#131313',
            }}
          >
            <div>
              <div style={titleStyle}>Positions Engine</div>
              <div style={{ fontSize: '13px', color: '#e5e5e5', fontWeight: 600 }}>
                All Underlyings
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              {['Select', 'Simulate', 'Add Leg', 'Actions'].map((item) => (
                <div
                  key={item}
                  style={{
                    background: '#101010',
                    border: '1px solid #2a2a2a',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    fontSize: '12px',
                    color: '#909090',
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <PositionsPanel />
          </div>
        </div>

        {/* RIGHT TOOL STACK */}
        <div
          style={{
            gridColumn: '4 / 5',
            gridRow: '2 / 4',
            display: 'grid',
            gridTemplateRows: '1fr 1fr 1fr',
            gap: '10px',
            minHeight: 0,
          }}
        >
          <div
            style={{
              ...panelStyle,
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={titleStyle}>Roll Scanner</div>
            <div
              style={{
                flex: 1,
                border: '1px solid #242424',
                borderRadius: '10px',
                background: '#101010',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '13px',
              }}
            >
              Roll Scanner Panel
            </div>
          </div>

          <div
            style={{
              ...panelStyle,
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={titleStyle}>Entry Scanner</div>
            <div
              style={{
                flex: 1,
                border: '1px solid #242424',
                borderRadius: '10px',
                background: '#101010',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '13px',
              }}
            >
              Entry Scanner Panel
            </div>
          </div>

          <div
            style={{
              ...panelStyle,
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={titleStyle}>Vol Surface / Heatmap</div>
            <div
              style={{
                flex: 1,
                border: '1px solid #242424',
                borderRadius: '10px',
                background: '#101010',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '13px',
              }}
            >
              Vol Surface / Heatmap
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;