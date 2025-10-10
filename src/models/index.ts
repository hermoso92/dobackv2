export interface Vehicle {
    id: number;
    name: string;
    stabilitySessions: StabilitySession[];
}

export interface StabilitySession {
    id: number;
    startTime: string;
    duration: number;
    score: number;
    stabilityEvents: StabilityEvent[];
}

export interface StabilityEvent {
    id: number;
    timestamp: string;
    type: string;
    severity: number;
    description: string;
} 