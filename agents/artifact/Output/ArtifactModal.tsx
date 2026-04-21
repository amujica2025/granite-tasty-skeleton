// frontend/src/components/artifact/ArtifactModal.tsx

import React from 'react';
import ArtifactCanvas from './ArtifactCanvas';
import { ArtifactPayload } from './artifactTypes';

type Props = {
  open: boolean;
  payload: ArtifactPayload | null;
  onClose: () => void;
};

export default function ArtifactModal({ open, payload, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        zIndex: 999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'absolute',
          inset: 40,
          background: '#111',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <ArtifactCanvas payload={payload} />
      </div>
    </div>
  );
}