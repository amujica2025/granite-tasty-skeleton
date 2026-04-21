export type OptionChainRow = {
  symbol?: string;
  expiration?: string;
  expiry?: string;
  strike?: number;
  iv?: number;
  impliedVolatility?: number;
  type?: 'call' | 'put';
  bid?: number;
  ask?: number;
  mark?: number;
};

export type ArtifactSurfaceNode = {
  expiry: string;
  strike: number;
  iv: number;
};

export type ArtifactSurfaceSource =
  | { type: 'surface'; nodes: ArtifactSurfaceNode[] }
  | { type: 'chain'; rows: OptionChainRow[] }
  | { type: 'synthetic' };

export type ArtifactPayload = {
  symbol: string;
  source: ArtifactSurfaceSource;
};
