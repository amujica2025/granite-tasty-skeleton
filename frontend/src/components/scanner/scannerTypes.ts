export type ScannerMode = 'entry'|'roll';
export type PositionRow = { symbol: string; strike: number; expiration: string; type: 'call'|'put'|'equity'; quantity: number; mark?: number; underlying_symbol?: string; };
export type ChainRow = { symbol: string; expiration: string; strike: number; type: 'call'|'put'; bid?: number; ask?: number; mark?: number; };
export type ScannerCandidate = { symbol: string; structure: string; credit: number; debit: number; net: number; bpEffect: number; score: number; };
