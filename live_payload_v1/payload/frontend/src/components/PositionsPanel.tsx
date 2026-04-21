import { useEffect, useState } from 'react';

type Position = { id: string; symbol: string; underlying_symbol?: string; quantity: number; mark?: number; average_open_price?: number; pl_open?: number; expiration?: string; strike?: number; type?: string; delta?: number; theta?: number; gamma?: number; bp_effect?: number; cost?: number; net_liq?: number; };

export default function PositionsPanel() {
  const [positions, setPositions] = useState<Position[]>([]);
  useEffect(() => {
    const load = () => fetch('/api/positions').then(r => r.json()).then(d => setPositions(Array.isArray(d?.positions) ? d.positions : [])).catch(() => setPositions([]));
    load();
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/account`);
    ws.onmessage = () => load();
    return () => ws.close();
  }, []);
  return <div style={{width:'100%',height:'100%',background:'#040404',overflow:'auto',fontSize:'0.78em'}}><table style={{width:'100%',borderCollapse:'collapse',minWidth:'1200px'}}><thead style={{position:'sticky',top:0,background:'#090909',zIndex:10}}><tr><th style={{textAlign:'left'}}>Position</th><th style={{textAlign:'right'}}>Qty</th><th style={{textAlign:'right'}}>Mark</th><th style={{textAlign:'right'}}>Avg</th><th style={{textAlign:'right'}}>P/L Open</th><th style={{textAlign:'right'}}>Net Liq</th><th style={{textAlign:'right'}}>BP Effect</th><th style={{textAlign:'right'}}>Exp</th><th style={{textAlign:'right'}}>Strike</th><th style={{textAlign:'right'}}>Type</th><th style={{textAlign:'right'}}>Delta</th><th style={{textAlign:'right'}}>Theta</th><th style={{textAlign:'right'}}>Gamma</th></tr></thead><tbody>{positions.map(p => <tr key={p.id} style={{borderBottom:'1px solid #111'}}><td style={{padding:'6px 5px'}}>{p.symbol}</td><td style={{textAlign:'right'}}>{p.quantity}</td><td style={{textAlign:'right'}}>{(p.mark||0).toFixed(2)}</td><td style={{textAlign:'right'}}>{(p.average_open_price||0).toFixed(2)}</td><td style={{textAlign:'right', color:(p.pl_open||0)>=0?'#22c55e':'#ef4444'}}>{(p.pl_open||0).toFixed(2)}</td><td style={{textAlign:'right'}}>{(p.net_liq||0).toFixed(2)}</td><td style={{textAlign:'right'}}>{(p.bp_effect||0).toFixed(2)}</td><td style={{textAlign:'right'}}>{p.expiration||'—'}</td><td style={{textAlign:'right'}}>{p.strike||0}</td><td style={{textAlign:'right'}}>{p.type||'—'}</td><td style={{textAlign:'right'}}>{(p.delta||0).toFixed(3)}</td><td style={{textAlign:'right'}}>{(p.theta||0).toFixed(3)}</td><td style={{textAlign:'right'}}>{(p.gamma||0).toFixed(3)}</td></tr>)}</tbody></table></div>;
}
