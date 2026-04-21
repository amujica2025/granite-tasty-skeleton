export type OptionChainRow = { symbol?: string; expiration?: string; strike?: number; iv?: number; type?: 'call'|'put'; bid?: number; ask?: number; mark?: number; delta?: number; gamma?: number; theta?: number; };
export type ArtifactPayload = { symbol: string; source: { type: 'chain'; rows: OptionChainRow[] } | { type: 'synthetic' } };
