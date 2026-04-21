import { useEffect, useState } from 'react';
import type { WatchlistPanelProps, WatchlistTickerRow } from './watchlistTypes';
import { formatPercent, formatPrice } from './watchlistUtils';

type Group = { key: string; rows: WatchlistTickerRow[] };

export default function WatchlistPanel({ onLaunchArtifact }: WatchlistPanelProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const load = async () => {
    const [weeklysRes, posRes] = await Promise.all([fetch('/api/watchlist?group=WEEKLYS'), fetch('/api/watchlist?group=POSITIONS')]);
    const weeklys = await weeklysRes.json(); const positions = await posRes.json();
    setGroups([{ key: 'WEEKLYS', rows: Array.isArray(weeklys.rows) ? weeklys.rows : [] }, { key: 'POSITIONS', rows: Array.isArray(positions.rows) ? positions.rows : [] }]);
  };
  useEffect(() => { load().catch(()=>{}); const ws = new WebSocket(`${window.location.protocol==='https:'?'wss':'ws'}://${window.location.host}/ws/market`); ws.onmessage = ()=>load().catch(()=>{}); return ()=>ws.close(); }, []);
  return <div style={{height:'100%', overflow:'auto', background:'#060606', color:'#e5e7eb', padding:8}}>{groups.map(group => <div key={group.key} style={{marginBottom:16}}><div style={{fontWeight:700, marginBottom:6}}>{group.key} ({group.rows.length})</div><div style={{display:'grid',gridTemplateColumns:'120px 100px 100px',gap:6,fontSize:11}}><div>Symbol</div><div style={{textAlign:'right'}}>Last</div><div style={{textAlign:'right'}}>%Chg</div>{group.rows.map(row => [<div key={`${group.key}_${row.symbol}`} onDoubleClick={()=>onLaunchArtifact?.({symbol:row.symbol,source:'watchlist',watchlistKey:group.key})} style={{cursor:'pointer'}}>{row.symbol}</div>,<div key={`${group.key}_${row.symbol}_p`} style={{textAlign:'right'}}>{formatPrice(row.latest)}</div>,<div key={`${group.key}_${row.symbol}_c`} style={{textAlign:'right', color: row.pctChange >=0 ? '#22c55e' : '#ef4444'}}>{formatPercent(row.pctChange)}</div>])}</div></div>)}</div>;
}
