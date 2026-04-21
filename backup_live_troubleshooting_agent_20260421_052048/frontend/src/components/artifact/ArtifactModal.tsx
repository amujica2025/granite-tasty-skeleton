import { useEffect, useState } from 'react';
import ArtifactCanvas from './ArtifactCanvas';
import type { ArtifactPayload, OptionChainRow } from './artifactTypes';
export default function ArtifactModal({ open, payload, onClose }: { open: boolean; payload: ArtifactPayload | null; onClose: () => void }) {
  const [livePayload, setLivePayload] = useState<ArtifactPayload | null>(payload);
  useEffect(() => {
    if (!open || !payload) return;
    if (payload.source.type === 'chain') { setLivePayload(payload); return; }
    fetch(`/api/chain?symbol=${encodeURIComponent(payload.symbol)}`).then(r=>r.json()).then(data=>{
      const rows: OptionChainRow[] = Array.isArray(data?.rows) ? data.rows : [];
      setLivePayload({ symbol: payload.symbol, source: { type: 'chain', rows } });
    }).catch(()=>setLivePayload(payload));
  }, [open, payload]);
  if (!open) return null;
  return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:999}} onClick={onClose}><div style={{position:'absolute',inset:40,background:'#111'}} onClick={(e)=>e.stopPropagation()}><ArtifactCanvas payload={livePayload} /></div></div>
}
