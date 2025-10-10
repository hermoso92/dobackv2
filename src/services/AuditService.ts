import { logger } from '../utils/logger';

export interface AuditLog {
    id: number;
    timestamp: string;
    userId: number;
    organizationId: number;
    actionType: string;
    resourceType: string;
    resourceId: string;
    requestMethod: string;
    requestPath: string;
    requestBody: Record<string, any>;
    statusCode: number;
    ipAddress: string;
    userAgent: string;
    createdAt: string;
}

export class AuditService {
    async logAction(auditLog: AuditLog): Promise<void> {
        try {
            // Aquí iría la lógica para guardar el log en la base de datos
            logger.info('Audit action logged', { auditLog });
        } catch (error) {
            logger.error('Error logging audit action', { error, auditLog });
            throw error;
        }
    }
} 