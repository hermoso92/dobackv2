export enum EventType {
    STABILITY = 'stability',
    SESSION = 'session',
    VEHICLE = 'vehicle',
    SYSTEM = 'system'
}

export enum EventSeverity {
    INFO = 'info',
    WARNING = 'warning',
    CRITICAL = 'critical'
}

export enum EventStatus {
    ACTIVE = 'active',
    RESOLVED = 'resolved'
}

export interface Event {
    id: string;
    type: EventType;
    severity: EventSeverity;
    status: EventStatus;
    message: string;
    timestamp: string;
    acknowledged: boolean;
    acknowledgedBy: string | null;
    acknowledgedAt: string | null;
    context: Record<string, any>;
}

export interface StabilityEvent extends Event {
    type: EventType.STABILITY;
    context: {
        metrics: {
            ltr: number;
            ssf: number;
            drs: number;
            rsc: number;
            loadTransfer: number;
            rollAngle: number;
            pitchAngle: number;
            yawAngle: number;
            lateralAcceleration: number;
            verticalAcceleration: number;
            longitudinalAcceleration: number;
        };
    };
} 