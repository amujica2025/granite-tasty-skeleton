import ArtifactCanvas from './ArtifactCanvas';
import ArtifactRail from './ArtifactRail';
import type { AnnotationStroke, Artifact, ArtifactStore } from './useArtifactStore';

type ArtifactModalStore = Pick<
  ArtifactStore,
  | 'artifacts'
  | 'activeArtifact'
  | 'activeArtifactId'
  | 'activeAnnotations'
  | 'isOpen'
  | 'closeModal'
  | 'setActiveArtifact'
  | 'appendAnnotationStroke'
  | 'clearAnnotations'
>;

type ArtifactModalProps = {
  store: ArtifactModalStore;
};

export default function ArtifactModal({ store }: ArtifactModalProps) {
  if (!store.isOpen || !store.activeArtifact || !store.activeArtifactId) {
    return null;
  }

  const activeArtifactId = store.activeArtifactId;
  const activeArtifact: Artifact = store.activeArtifact;
  const activeAnnotations: AnnotationStroke[] = store.activeAnnotations;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.94)',
        display: 'flex',
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #101010',
        }}
      >
        <div
          style={{
            height: 44,
            minHeight: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '0 12px',
            borderBottom: '1px solid #1f1f1f',
            background: '#060606',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#e5e5e5',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeArtifact.title}
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#8d8d8d',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeArtifact.subtitle}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => store.clearAnnotations(activeArtifactId)}
              style={{
                border: '1px solid #333',
                background: '#111',
                color: '#ddd',
                fontSize: 11,
                padding: '5px 10px',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
            <button
              onClick={store.closeModal}
              style={{
                border: '1px solid #333',
                background: '#111',
                color: '#ddd',
                fontSize: 11,
                padding: '5px 10px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>

        <ArtifactCanvas
          artifact={activeArtifact}
          annotations={activeAnnotations}
          onCommitStroke={(stroke: AnnotationStroke) =>
            store.appendAnnotationStroke(activeArtifactId, stroke)
          }
        />
      </div>

      <ArtifactRail
        artifacts={store.artifacts}
        activeArtifactId={store.activeArtifactId}
        onSelect={store.setActiveArtifact}
      />
    </div>
  );
}