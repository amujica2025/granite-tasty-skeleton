import type { ArtifactPayload } from './artifactTypes';
import { buildGrid } from './artifactUtils';
export default function ArtifactCanvas({ payload }: { payload: ArtifactPayload | null }) {
  const rows = payload?.source.type === 'chain' ? payload.source.rows : [];
  const grid = buildGrid(rows);
  const flat = grid.z.flat().filter((v): v is number => typeof v === 'number');
  const min = flat.length ? Math.min(...flat) : 0; const max = flat.length ? Math.max(...flat) : 1;
  return <div style={{padding:12,color:'#e5e7eb',height:'100%',overflow:'auto'}}><div style={{marginBottom:8,fontWeight:700}}>{payload?.symbol} Live Surface</div><div style={{display:'grid', gridTemplateColumns:`120px repeat(${grid.strikes.length}, minmax(64px,1fr))`, gap:4}}><div />{grid.strikes.map(s=><div key={s} style={{textAlign:'right',fontSize:11}}>{s}</div>)}{grid.expiries.map((exp,row)=>[<div key={exp} style={{fontSize:11}}>{exp}</div>, ...grid.strikes.map((strike,col)=>{const value = grid.z[row]?.[col]; const ratio = typeof value==='number' && max>min ? (value-min)/(max-min) : 0; return <div key={`${exp}_${strike}`} style={{textAlign:'right',padding:'6px 8px',background:`rgba(59,130,246,${0.15+ratio*0.45})`, border:'1px solid #1f2937'}}>{typeof value==='number'?value.toFixed(3):'—'}</div>;})])}</div></div>
}
