import { useState } from 'react';
import { ArtifactPayload } from './artifactTypes';

export function useArtifactStore() {
  const [isOpen, setIsOpen] = useState(false);
  const [payload, setPayload] = useState<ArtifactPayload | null>(null);

  const openArtifact = (nextPayload: ArtifactPayload) => {
    setPayload(nextPayload);
    setIsOpen(true);
  };

  const closeArtifact = () => {
    setIsOpen(false);
    setPayload(null);
  };

  return {
    isOpen,
    open: isOpen,
    payload,
    openArtifact,
    closeArtifact,
  };
}
