import { useEffect, useState } from 'react';
import PositionsPanel from './components/PositionsPanel';

function App() {
  const [netLiq, setNetLiq] = useState<number | null>(null);

  // Fetch real Net Liq on load and every 30 seconds
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

    fetchBalances();                    // initial load
    const interval = setInterval(fetchBalances, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Market WebSocket - background only (quotes keep flowing)
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/market');

    ws.onopen = () => console.log('✅ Market WS connected');
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "RawFeed" && msg.data && msg.data.type === "FEED_DATA") {
          const feed = msg.data.data;
          if (feed[0] === "Quote") {
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

  return (
    <div style={{
      padding: '16px',
      fontFamily: 'system-ui, sans-serif',
      background: '#0a0a0a',
      color: '#fff',
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '280px 1fr 380px',
      gridTemplateRows: '1fr',
      gap: '12px',
      height: '100vh'
    }}>
      {/* Left: Watchlist Sidebar */}
      <div style={{
        background: '#1f1f1f',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #333',
        overflow: 'auto'
      }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Watchlist</h3>
        <div style={{ fontSize: '0.9em', color: '#aaa' }}>
          Watchlist placeholder - we'll expand this later
        </div>
      </div>

      {/* Center Hero: Positions Panel */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Big Net Liq Box - always visible */}
        <div style={{
          background: '#1f1f1f',
          border: '2px solid #22c55e',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.95em', color: '#aaa', marginBottom: '8px' }}>
            NET LIQUIDATING VALUE
          </div>
          <div style={{ fontSize: '2.8em', fontWeight: 'bold', color: '#22c55e', fontFamily: 'monospace' }}>
            ${netLiq !== null ? netLiq.toLocaleString() : 'Loading...'}
          </div>
        </div>

        <PositionsPanel />
      </div>

      {/* Right Column: Charting + Vol Surface / Heatmap */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{
          flex: 1,
          background: '#1f1f1f',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #333'
        }}>
          Charting Panel (placeholder)
        </div>
        <div style={{
          flex: 1,
          background: '#1f1f1f',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid #333'
        }}>
          Vol Surface / Heatmap (placeholder)
        </div>
      </div>
    </div>
  );
}

export default App;