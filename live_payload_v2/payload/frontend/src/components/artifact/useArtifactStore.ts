import { useState } from 'react';
import type { ArtifactPayload } from './artifactTypes';
export function useArtifactStore(){const [open,setOpen]=useState(false); const [payload,setPayload]=useState<ArtifactPayload|null>(null); return {open,payload,openArtifact:(p:ArtifactPayload)=>{setPayload(p);setOpen(true);},closeArtifact:()=>{setOpen(false);setPayload(null);}}}
export type Artifact = ArtifactPayload;
