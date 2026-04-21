import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  AnnotationPoint,
  AnnotationStroke,
  Artifact,
} from './useArtifactStore';

type ArtifactCanvasProps = {
  artifact: Artifact;
  annotations: AnnotationStroke[];
  onCommitStroke: (stroke: AnnotationStroke) => void;
};

const SVG_WIDTH = 1600;
const SVG_HEIGHT = 900;

function buildPolylinePoints(points: AnnotationPoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(' ');
}

function createStrokeId(): string {
  return `stroke_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function ArtifactCanvas({
  artifact,
  annotations,
  onCommitStroke,
}: ArtifactCanvasProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [draftPoints, setDraftPoints] = useState<AnnotationPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    setDraftPoints([]);
    setIsDrawing(false);
  }, [artifact.artifact_id]);

  const seriesPoints = useMemo<string>(() => {
    if (artifact.series.length === 0) return '';

    const maxValue = Math.max(...artifact.series, 1);
    const stepX =
      artifact.series.length > 1 ? SVG_WIDTH / (artifact.series.length - 1) : SVG_WIDTH / 2;

    return artifact.series
      .map((value, index) => {
        const x = index * stepX;
        const normalizedY = maxValue === 0 ? 0.5 : value / maxValue;
        const y = SVG_HEIGHT - normalizedY * (SVG_HEIGHT * 0.7) - 120;
        return `${x},${y}`;
      })
      .join(' ');
  }, [artifact.series]);

  const getRelativePoint = (
    clientX: number,
    clientY: number,
  ): AnnotationPoint | null => {
    const surface = surfaceRef.current;
    if (!surface) return null;

    const rect = surface.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const x = ((clientX - rect.left) / rect.width) * SVG_WIDTH;
    const y = ((clientY - rect.top) / rect.height) * SVG_HEIGHT;

    return { x, y };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const point = getRelativePoint(event.clientX, event.clientY);
    if (!point) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDrawing(true);
    setDraftPoints([point]);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing) return;

    const point = getRelativePoint(event.clientX, event.clientY);
    if (!point) return;

    setDraftPoints((prev) => [...prev, point]);
  };

  const finishStroke = () => {
    if (!isDrawing) return;

    setIsDrawing(false);

    if (draftPoints.length >= 2) {
      const stroke: AnnotationStroke = {
        stroke_id: createStrokeId(),
        points: draftPoints,
      };
      onCommitStroke(stroke);
    }

    setDraftPoints([]);
  };

  return (
    <div
      ref={surfaceRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishStroke}
      onPointerLeave={finishStroke}
      style={{
        flex: 1,
        minHeight: 0,
        position: 'relative',
        background:
          'linear-gradient(180deg, rgba(12,12,12,1) 0%, rgba(4,4,4,1) 100%)',
        overflow: 'hidden',
        cursor: 'crosshair',
      }}
    >
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <pattern
            id="artifact-grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect x="0" y="0" width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#artifact-grid)" />

        <line
          x1="0"
          y1={SVG_HEIGHT - 120}
          x2={SVG_WIDTH}
          y2={SVG_HEIGHT - 120}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1"
        />
        <line
          x1="100"
          y1="40"
          x2="100"
          y2={SVG_HEIGHT - 40}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1"
        />

        {seriesPoints ? (
          <polyline
            points={seriesPoints}
            fill="none"
            stroke="rgba(96,165,250,0.95)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : (
          <text
            x="120"
            y="160"
            fill="rgba(255,255,255,0.52)"
            fontSize="28"
            fontFamily="Arial, Helvetica, sans-serif"
          >
            No series loaded for this artifact yet.
          </text>
        )}

        {annotations.map((stroke) => (
          <polyline
            key={stroke.stroke_id}
            points={buildPolylinePoints(stroke.points)}
            fill="none"
            stroke="rgba(250,204,21,0.96)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {draftPoints.length >= 2 && (
          <polyline
            points={buildPolylinePoints(draftPoints)}
            fill="none"
            stroke="rgba(250,204,21,0.96)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
      </svg>

      <div
        style={{
          position: 'absolute',
          left: 16,
          bottom: 14,
          display: 'flex',
          gap: 12,
          fontSize: 11,
          color: 'rgba(255,255,255,0.58)',
          letterSpacing: '0.03em',
          pointerEvents: 'none',
        }}
      >
        <span>{artifact.artifact_type.toUpperCase()}</span>
        <span>{artifact.source.toUpperCase()}</span>
        <span>FREEHAND ANNOTATION</span>
      </div>
    </div>
  );
}