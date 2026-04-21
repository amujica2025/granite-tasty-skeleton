export type AlertField = 'price' | '%';
export type AlertOperator = '>' | '<' | '>=' | '<=' | 'crosses_above' | 'crosses_below';
export type AlertRule = { id: string; symbol: string; field: AlertField; operator: AlertOperator; value: number; enabled: boolean; desktop: boolean; pushover: boolean; triggerOnceUntilReset: boolean; cooldownMs: number; };
export type AlertHistoryEntry = { id: string; symbol: string; message: string; timestamp: number; };
