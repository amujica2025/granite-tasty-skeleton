import { useMemo, useState } from 'react';

export type ArtifactType =
  | 'chart'
  | 'risk_curve'
  | 'vol_surface'
  | 'structure_view'
  | 'roll_compare';

export type ArtifactSource = 'positions' | 'scanner' | 'journal' | 'alerts';

export type AnnotationEventType =
  | 'annotation_added'
  | 'annotation_cleared'
  | 'artifact_opened'
  | 'artifact_switched';

export type ArtifactContextPayload = Record<string, unknown>;

export type AnnotationPoint = {
  x: number;
  y: number;
};

export type AnnotationStroke = {
  stroke_id: string;
  points: AnnotationPoint[];
};

export type Artifact = {
  artifact_id: string;
  artifact_type: ArtifactType;
  title: string;
  subtitle: string;
  source: ArtifactSource;
  context_payload: ArtifactContextPayload;
  series: number[];
  annotations: AnnotationStroke[];
};

export type AnnotationEventContract = {
  annotation_event_id: string;
  artifact_id: string;
  event_type: AnnotationEventType;
  event_ts: string;
  payload: Record<string, unknown>;
};

type ArtifactStoreState = {
  artifacts: Artifact[];
  activeArtifactId: string | null;
  isOpen: boolean;
  annotationsByArtifactId: Record<string, AnnotationStroke[]>;
  events: AnnotationEventContract[];
};

export type ArtifactStore = {
  artifacts: Artifact[];
  activeArtifact: Artifact | null;
  activeArtifactId: string | null;
  activeAnnotations: AnnotationStroke[];
  isOpen: boolean;
  openArtifact: (artifact: Artifact) => void;
  closeModal: () => void;
  setActiveArtifact: (artifactId: string) => void;
  appendAnnotationStroke: (artifactId: string, stroke: AnnotationStroke) => void;
  clearAnnotations: (artifactId: string) => void;
};

const EMPTY_ANNOTATIONS: AnnotationStroke[] = [];

function createEvent(
  artifactId: string,
  eventType: AnnotationEventType,
  payload: Record<string, unknown>,
): AnnotationEventContract {
  return {
    annotation_event_id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    artifact_id: artifactId,
    event_type: eventType,
    event_ts: new Date().toISOString(),
    payload,
  };
}

export function useArtifactStore(): ArtifactStore {
  const [state, setState] = useState<ArtifactStoreState>({
    artifacts: [],
    activeArtifactId: null,
    isOpen: false,
    annotationsByArtifactId: {},
    events: [],
  });

  const activeArtifact = useMemo<Artifact | null>(() => {
    if (!state.activeArtifactId) return null;

    return (
      state.artifacts.find(
        (artifact) => artifact.artifact_id === state.activeArtifactId,
      ) ?? null
    );
  }, [state.activeArtifactId, state.artifacts]);

  const activeAnnotations = useMemo<AnnotationStroke[]>(() => {
    if (!state.activeArtifactId) return EMPTY_ANNOTATIONS;
    return state.annotationsByArtifactId[state.activeArtifactId] ?? EMPTY_ANNOTATIONS;
  }, [state.activeArtifactId, state.annotationsByArtifactId]);

  const openArtifact = (artifact: Artifact) => {
    setState((prev) => {
      const existing = prev.artifacts.find(
        (candidate) => candidate.artifact_id === artifact.artifact_id,
      );

      if (existing) {
        return {
          ...prev,
          activeArtifactId: existing.artifact_id,
          isOpen: true,
          events: [
            ...prev.events,
            createEvent(existing.artifact_id, 'artifact_opened', {
              reactivated_existing: true,
            }),
          ],
        };
      }

      return {
        ...prev,
        artifacts: [...prev.artifacts, artifact],
        activeArtifactId: artifact.artifact_id,
        isOpen: true,
        annotationsByArtifactId: {
          ...prev.annotationsByArtifactId,
          [artifact.artifact_id]:
            prev.annotationsByArtifactId[artifact.artifact_id] ?? artifact.annotations,
        },
        events: [
          ...prev.events,
          createEvent(artifact.artifact_id, 'artifact_opened', {
            reactivated_existing: false,
          }),
        ],
      };
    });
  };

  const closeModal = () => {
    setState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  const setActiveArtifact = (artifactId: string) => {
    setState((prev) => {
      if (prev.activeArtifactId === artifactId) {
        return prev;
      }

      return {
        ...prev,
        activeArtifactId: artifactId,
        events: [
          ...prev.events,
          createEvent(artifactId, 'artifact_switched', {}),
        ],
      };
    });
  };

  const appendAnnotationStroke = (artifactId: string, stroke: AnnotationStroke) => {
    setState((prev) => {
      const existing = prev.annotationsByArtifactId[artifactId] ?? EMPTY_ANNOTATIONS;

      return {
        ...prev,
        annotationsByArtifactId: {
          ...prev.annotationsByArtifactId,
          [artifactId]: [...existing, stroke],
        },
        events: [
          ...prev.events,
          createEvent(artifactId, 'annotation_added', {
            stroke_id: stroke.stroke_id,
            point_count: stroke.points.length,
          }),
        ],
      };
    });
  };

  const clearAnnotations = (artifactId: string) => {
    setState((prev) => ({
      ...prev,
      annotationsByArtifactId: {
        ...prev.annotationsByArtifactId,
        [artifactId]: [],
      },
      events: [
        ...prev.events,
        createEvent(artifactId, 'annotation_cleared', {}),
      ],
    }));
  };

  return {
    artifacts: state.artifacts,
    activeArtifact,
    activeArtifactId: state.activeArtifactId,
    activeAnnotations,
    isOpen: state.isOpen,
    openArtifact,
    closeModal,
    setActiveArtifact,
    appendAnnotationStroke,
    clearAnnotations,
  };
}