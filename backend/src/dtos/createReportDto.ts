export interface CreateReportDto {
    sessionId: string;
    filters?: {
        speedFilter?: 'all' | '40' | '60' | '80' | '100' | '120' | '140';
        rpmFilter?: 'all' | '1500' | '2000' | '2500';
        rotativoOnly?: boolean;
        selectedTypes?: string[];
        // Campos legacy para compatibilidad
        severity?: string[];
        eventTypes?: string[];
        speedMin?: number;
        rpmMin?: number;
    };
}
