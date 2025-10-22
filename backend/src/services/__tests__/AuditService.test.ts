
import { AuditActionType } from '../../types/enums';
import { AuditService } from '../AuditService';

describe('AuditService', () => {
    let service: AuditService;
    let prisma: PrismaClient;

    beforeEach(() => {
        prisma = new PrismaClient();
        service = new AuditService(prisma);
    });

    afterEach(async () => {
        await prisma.$disconnect();
    });

    describe('logAction', () => {
        it('should log an audit action', async () => {
            // Arrange
            const auditData = {
                userId: 1,
                organizationId: 1,
                actionType: AuditActionType.FILE_UPLOAD,
                resourceType: 'stability-data',
                resourceId: 'test-file-id',
                ipAddress: '127.0.0.1',
                description: 'Test audit log',
                details: {
                    fileName: 'test.csv'
                }
            };

            jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({
                id: 1,
                ...auditData,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Act
            const result = await service.logAction(auditData);

            // Assert
            expect(result).toBeDefined();
            expect(result.id).toBe(1);
            expect(result.actionType).toBe(auditData.actionType);
            expect(result.resourceType).toBe(auditData.resourceType);
            expect(result.resourceId).toBe(auditData.resourceId);
        });

        it('should handle error when logging action', async () => {
            // Arrange
            const auditData = {
                userId: 1,
                organizationId: 1,
                actionType: AuditActionType.FILE_UPLOAD,
                resourceType: 'stability-data',
                resourceId: 'test-file-id',
                ipAddress: '127.0.0.1',
                description: 'Test audit log',
                details: {
                    fileName: 'test.csv'
                }
            };

            jest.spyOn(prisma.auditLog, 'create').mockRejectedValue(new Error('Database error'));

            // Act & Assert
            await expect(service.logAction(auditData)).rejects.toThrow('Database error');
        });
    });

    describe('getAuditLogs', () => {
        it('should get audit logs by organization', async () => {
            // Arrange
            const auditLogs = [
                {
                    id: 1,
                    userId: 1,
                    organizationId: 1,
                    actionType: AuditActionType.FILE_UPLOAD,
                    resourceType: 'stability-data',
                    resourceId: 'test-file-id',
                    ipAddress: '127.0.0.1',
                    description: 'Test audit log',
                    details: {
                        fileName: 'test.csv'
                    },
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue(auditLogs);

            // Act
            const result = await service.getAuditLogsByOrganization(1);

            // Assert
            expect(result).toEqual(auditLogs);
        });

        it('should return empty array when no logs found', async () => {
            // Arrange
            jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([]);

            // Act
            const result = await service.getAuditLogsByOrganization(999);

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('getAuditLogsByUser', () => {
        it('should get audit logs by user', async () => {
            // Arrange
            const auditLogs = [
                {
                    id: 1,
                    userId: 1,
                    organizationId: 1,
                    actionType: AuditActionType.FILE_UPLOAD,
                    resourceType: 'stability-data',
                    resourceId: 'test-file-id',
                    ipAddress: '127.0.0.1',
                    description: 'Test audit log',
                    details: {
                        fileName: 'test.csv'
                    },
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue(auditLogs);

            // Act
            const result = await service.getAuditLogsByUser(1);

            // Assert
            expect(result).toEqual(auditLogs);
        });

        it('should return empty array when no logs found for user', async () => {
            // Arrange
            jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([]);

            // Act
            const result = await service.getAuditLogsByUser(999);

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('getAuditLogsByActionType', () => {
        it('should get audit logs by action type', async () => {
            // Arrange
            const auditLogs = [
                {
                    id: 1,
                    userId: 1,
                    organizationId: 1,
                    actionType: AuditActionType.FILE_UPLOAD,
                    resourceType: 'stability-data',
                    resourceId: 'test-file-id',
                    ipAddress: '127.0.0.1',
                    description: 'Test audit log',
                    details: {
                        fileName: 'test.csv'
                    },
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue(auditLogs);

            // Act
            const result = await service.getAuditLogsByActionType(AuditActionType.FILE_UPLOAD);

            // Assert
            expect(result).toEqual(auditLogs);
        });

        it('should return empty array when no logs found for action type', async () => {
            // Arrange
            jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([]);

            // Act
            const result = await service.getAuditLogsByActionType(AuditActionType.ACCESS_DENIED);

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('getAuditLogsByDateRange', () => {
        it('should get audit logs by date range', async () => {
            // Arrange
            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');

            const auditLogs = [
                {
                    id: 1,
                    userId: 1,
                    organizationId: 1,
                    actionType: AuditActionType.FILE_UPLOAD,
                    resourceType: 'stability-data',
                    resourceId: 'test-file-id',
                    ipAddress: '127.0.0.1',
                    description: 'Test audit log',
                    details: {
                        fileName: 'test.csv'
                    },
                    createdAt: new Date('2024-06-01'),
                    updatedAt: new Date('2024-06-01')
                }
            ];

            jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue(auditLogs);

            // Act
            const result = await service.getAuditLogsByDateRange(startDate, endDate);

            // Assert
            expect(result).toEqual(auditLogs);
        });

        it('should return empty array when no logs found in date range', async () => {
            // Arrange
            const startDate = new Date('2023-01-01');
            const endDate = new Date('2023-12-31');

            jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([]);

            // Act
            const result = await service.getAuditLogsByDateRange(startDate, endDate);

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('countAuditLogsByActionType', () => {
        it('should count audit logs by action type', async () => {
            // Arrange
            jest.spyOn(prisma.auditLog, 'count').mockResolvedValue(5);

            // Act
            const result = await service.countAuditLogsByActionType(AuditActionType.FILE_UPLOAD);

            // Assert
            expect(result).toBe(5);
        });

        it('should return 0 when no logs found for action type', async () => {
            // Arrange
            jest.spyOn(prisma.auditLog, 'count').mockResolvedValue(0);

            // Act
            const result = await service.countAuditLogsByActionType(AuditActionType.ACCESS_DENIED);

            // Assert
            expect(result).toBe(0);
        });
    });
});
