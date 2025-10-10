export type StabilityEventType = 'LTR' | 'ROLL_ANGLE' | 'LATERAL_ACCELERATION';
export type StabilityEventSeverity = 'critical' | 'warning';

export interface Alarm {
    id: number;
    name: string;
    type: StabilityEventType;
    condition: 'greater' | 'less' | 'equal';
    threshold: number;
    enabled: boolean;
    description: string;
    createdAt: string;
    updatedAt: string;
} 