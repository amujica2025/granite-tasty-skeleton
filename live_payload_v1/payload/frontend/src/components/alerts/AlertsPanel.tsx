import { useEffect, useState } from 'react';
import type { AlertHistoryEntry, AlertRule } from './alertsTypes';
import { ensureBrowserNotifications, sendBrowserNotification } from './alertsUtils';

const blankRule = (): AlertRule => ({ id: `rule_${Date.now()}_${Math.random().toString(36).slice(2,8)}`, symbol: 'SPY', field: 'price', operator: '>', value: 0, enabled: true, desktop: true, pushover: true, triggerOnceUntilReset: false, cooldownMs: 0 });

export default function AlertsPanel() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [history, setHistory] = useState<AlertHistoryEntry[]>([]);

  const load = async () => {
    const [rulesRes, histRes] = await Promise.all([fetch('/api/alerts/rules'), fetch('/api/alerts/history')]);
    const rulesJson = await rulesRes.json();
    const histJson = await histRes.json();
    setRules(Array.isArray(rulesJson.rules) ? rulesJson.rules : []);
    setHistory(Array.isArray(histJson.events) ? histJson.events : []);
  };

  useEffect(() => { load().catch(() => {}); ensureBrowserNotifications().catch(() => {}); }, []);
  useEffect(() => {
    const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/alerts`);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'alert_triggered' && msg.event) {
          setHistory((prev) => [msg.event, ...prev].slice(0, 100));
          sendBrowserNotification(msg.event.message);
        }
      } catch {}
    };
    return () => ws.close();
  }, []);

  const saveRule = async (rule: AlertRule) => {
    const exists = rules.some((r) => r.id === rule.id);
    const url = exists ? `/api/alerts/rules/${rule.id}` : '/api/alerts/rules';
    const method = exists ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rule) });
    await load();
  };
  const removeRule = async (id: string) => { await fetch(`/api/alerts/rules/${id}`, { method: 'DELETE' }); await load(); };

  return <div style={{padding:12, color:'#111', overflow:'auto', height:'100%'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h3 style={{margin:0}}>Alerts</h3><button onClick={() => setRules((r) => [blankRule(), ...r])}>Add</button></div>
    <div style={{display:'grid', gap:8, marginTop:8}}>{rules.map((rule) => <div key={rule.id} style={{display:'grid', gridTemplateColumns:'90px 80px 120px 80px 1fr auto', gap:6, alignItems:'center'}}>
      <input value={rule.symbol} onChange={(e)=>setRules(rs=>rs.map(r=>r.id===rule.id?{...r,symbol:e.target.value.toUpperCase()}:r))}/>
      <select value={rule.field} onChange={(e)=>setRules(rs=>rs.map(r=>r.id===rule.id?{...r,field:e.target.value as AlertRule['field']}:r))}><option value='price'>price</option><option value='%'>%</option></select>
      <select value={rule.operator} onChange={(e)=>setRules(rs=>rs.map(r=>r.id===rule.id?{...r,operator:e.target.value as AlertRule['operator']}:r))}><option>{'>'}</option><option>{'<'}</option><option>{'>='}</option><option>{'<='}</option><option value='crosses_above'>crosses_above</option><option value='crosses_below'>crosses_below</option></select>
      <input type='number' value={rule.value} onChange={(e)=>setRules(rs=>rs.map(r=>r.id===rule.id?{...r,value:Number(e.target.value)}:r))}/>
      <label style={{display:'flex',gap:8,fontSize:12}}><input type='checkbox' checked={rule.enabled} onChange={(e)=>setRules(rs=>rs.map(r=>r.id===rule.id?{...r,enabled:e.target.checked}:r))}/>enabled</label>
      <div style={{display:'flex',gap:4}}><button onClick={()=>saveRule(rule)}>Save</button><button onClick={()=>removeRule(rule.id)}>X</button></div>
      <div style={{gridColumn:'1 / span 6', display:'flex', gap:12, fontSize:12}}>
        <label><input type='checkbox' checked={rule.desktop} onChange={(e)=>setRules(rs=>rs.map(r=>r.id===rule.id?{...r,desktop:e.target.checked}:r))}/> desktop</label>
        <label><input type='checkbox' checked={rule.pushover} onChange={(e)=>setRules(rs=>rs.map(r=>r.id===rule.id?{...r,pushover:e.target.checked}:r))}/> pushover</label>
        <label>cooldown ms <input type='number' value={rule.cooldownMs} onChange={(e)=>setRules(rs=>rs.map(r=>r.id===rule.id?{...r,cooldownMs:Number(e.target.value)}:r))} style={{width:90}}/></label>
      </div>
    </div>)}</div>
    <div style={{marginTop:16}}><h4 style={{margin:'6px 0'}}>History</h4>{history.slice(0,25).map((h)=><div key={h.id} style={{fontSize:12}}>{new Date(h.timestamp).toLocaleTimeString()} — {h.message}</div>)}</div>
  </div>;
}
