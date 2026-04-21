// frontend/src/components/artifact/useArtifactStore.ts

import { useState } from 'react';
import type { ArtifactPayload } from './artifactTypes';

export function useArtifactStore() {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<ArtifactPayload | null>(null);

  const openArtifact = (p: ArtifactPayload) => {
    setPayload(p);
    setOpen(true);
  };

  const closeArtifact = () => {
    setOpen(false);
    setPayload(null);
  };

  return {
    open,
    payload,
    openArtifact,
    closeArtifact,
  };
}
export type Artifact = ArtifactPayload;
