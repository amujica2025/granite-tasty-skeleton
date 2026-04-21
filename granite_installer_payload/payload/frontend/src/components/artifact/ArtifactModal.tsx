import ArtifactCanvas from './ArtifactCanvas';
import { ArtifactPayload } from './artifactTypes';

type StoreShape = {
  isOpen?: boolean;
  open?: boolean;
  payload: ArtifactPayload | null;
  closeArtifact: () => void;
};

type Props = {
  store: StoreShape;
};

export default function ArtifactModal({ store }: Props) {
  const isOpen = store.isOpen ?? store.open ?? false;
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.82)',
        zIndex: 2200,
      }}
      onClick={store.closeArtifact}
    >
      <div
        style={{
          position: 'absolute',
          inset: 36,
          background: '#0a0a0a',
          border: '1px solid #1f1f1f',
          boxShadow: '0 20px 80px rgba(0,0,0,0.55)',
          overflow: 'hidden',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <ArtifactCanvas payload={store.payload} />
      </div>
    </div>
  );
}
