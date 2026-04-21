import type { ArtifactPayload } from './artifactTypes';

type ArtifactRailProps = {
  artifacts?: ArtifactPayload[];
  activeArtifactId?: string | null;
  onSelect?: (artifactId: string) => void;
};

function getArtifactId(artifact: ArtifactPayload, index: number) {
  if ('artifact_id' in artifact && typeof (artifact as { artifact_id?: unknown }).artifact_id === 'string') {
    return (artifact as { artifact_id: string }).artifact_id;
  }
  return `${artifact.symbol}-${index}`;
}

function getArtifactTitle(artifact: ArtifactPayload) {
  if ('title' in artifact && typeof (artifact as { title?: unknown }).title === 'string') {
    return (artifact as { title: string }).title;
  }
  return `${artifact.symbol} Artifact`;
}

function getArtifactSubtitle(artifact: ArtifactPayload) {
  if ('subtitle' in artifact && typeof (artifact as { subtitle?: unknown }).subtitle === 'string') {
    return (artifact as { subtitle: string }).subtitle;
  }
  if ('artifact_type' in artifact && typeof (artifact as { artifact_type?: unknown }).artifact_type === 'string') {
    return (artifact as { artifact_type: string }).artifact_type;
  }
  return artifact.source.type;
}

export default function ArtifactRail({
  artifacts = [],
  activeArtifactId = null,
  onSelect,
}: ArtifactRailProps) {
  if (artifacts.length === 0) {
    return (
      <div
        style={{
          width: 220,
          borderRight: '1px solid #1f1f1f',
          background: '#0b0b0b',
          color: '#9ca3af',
          padding: 12,
          fontSize: 11,
        }}
      >
        No artifacts
      </div>
    );
  }

  return (
    <div
      style={{
        width: 220,
        borderRight: '1px solid #1f1f1f',
        background: '#0b0b0b',
        overflowY: 'auto',
        padding: 8,
        display: 'grid',
        gap: 8,
      }}
    >
      {artifacts.map((artifact, index) => {
        const artifactId = getArtifactId(artifact, index);
        const isActive = artifactId === activeArtifactId;

        return (
          <button
            key={artifactId}
            type="button"
            onClick={() => onSelect?.(artifactId)}
            style={{
              textAlign: 'left',
              border: isActive ? '1px solid #60a5fa' : '1px solid #222',
              background: isActive ? '#111827' : '#111',
              color: '#e5e7eb',
              padding: 10,
              cursor: 'pointer',
              display: 'grid',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700 }}>{getArtifactTitle(artifact)}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{getArtifactSubtitle(artifact)}</div>
            <div style={{ fontSize: 10, color: '#cbd5e1' }}>{artifact.symbol}</div>
          </button>
        );
      })}
    </div>
  );
}
