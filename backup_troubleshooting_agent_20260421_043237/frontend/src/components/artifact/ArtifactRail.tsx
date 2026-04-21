import type { Artifact } from './useArtifactStore';

type ArtifactRailProps = {
  artifacts: Artifact[];
  activeArtifactId: string | null;
  onSelect: (artifactId: string) => void;
};

export default function ArtifactRail({
  artifacts,
  activeArtifactId,
  onSelect,
}: ArtifactRailProps) {
  return (
    <div
      style={{
        width: 128,
        minWidth: 128,
        borderLeft: '1px solid #1f1f1f',
        background: '#080808',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {artifacts.map((artifact) => {
        const isActive = artifact.artifact_id === activeArtifactId;

        return (
          <button
            key={artifact.artifact_id}
            onClick={() => onSelect(artifact.artifact_id)}
            style={{
              border: 'none',
              borderBottom: '1px solid #141414',
              background: isActive ? '#151515' : '#080808',
              color: '#d4d4d4',
              padding: '10px 8px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                height: 58,
                border: isActive ? '1px solid #d4d4d4' : '1px solid #2b2b2b',
                background:
                  'linear-gradient(180deg, rgba(28,28,28,1) 0%, rgba(14,14,14,1) 100%)',
                marginBottom: 8,
              }}
            />
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1.3,
                marginBottom: 4,
                wordBreak: 'break-word',
              }}
            >
              {artifact.title}
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#8d8d8d',
                lineHeight: 1.25,
                wordBreak: 'break-word',
              }}
            >
              {artifact.subtitle || artifact.artifact_type}
            </div>
          </button>
        );
      })}
    </div>
  );
}