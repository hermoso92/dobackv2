import { apiService } from '../services/api';
import {
    AdminApiResponse,
    AdminFilters,
    AdminSettings,
    AdminStats,
    ApiKeyDTO,
    AuditLogDTO,
    FeatureFlag,
    OrganizationDTO,
    SecurityEventDTO,
    SecuritySettings,
    UserDTO
} from '../types/admin';
import { logger } from '../utils/logger';

export class AdminAPI {
    // Gestión de usuarios
    static async getUsers(filters: AdminFilters = {}): Promise<UserDTO[]> {
        try {
            const response = await apiService.get<AdminApiResponse<UserDTO[]>>(
                '/api/admin/users',
                { params: filters }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo usuarios');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo usuarios', { error, filters });
            throw error;
        }
    }

    static async getUser(userId: string): Promise<UserDTO> {
        try {
            const response = await apiService.get<AdminApiResponse<UserDTO>>(
                `/api/admin/users/${userId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo usuario');
            }

            if (!response.data.data) {
                throw new Error('Usuario no encontrado');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo usuario', { error, userId });
            throw error;
        }
    }

    static async createUser(userData: Partial<UserDTO>): Promise<UserDTO> {
        try {
            const response = await apiService.post<AdminApiResponse<UserDTO>>(
                '/api/admin/users',
                userData
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error creando usuario');
            }

            if (!response.data.data) {
                throw new Error('Error al crear el usuario');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error creando usuario', { error, userData });
            throw error;
        }
    }

    static async updateUser(userId: string, userData: Partial<UserDTO>): Promise<UserDTO> {
        try {
            const response = await apiService.put<AdminApiResponse<UserDTO>>(
                `/api/admin/users/${userId}`,
                userData
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error actualizando usuario');
            }

            if (!response.data.data) {
                throw new Error('Error al actualizar el usuario');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error actualizando usuario', { error, userId, userData });
            throw error;
        }
    }

    static async deleteUser(userId: string): Promise<void> {
        try {
            const response = await apiService.delete<AdminApiResponse<void>>(
                `/api/admin/users/${userId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error eliminando usuario');
            }
        } catch (error) {
            logger.error('Error eliminando usuario', { error, userId });
            throw error;
        }
    }

    // Gestión de organizaciones
    static async getOrganizations(): Promise<OrganizationDTO[]> {
        try {
            const response = await apiService.get<AdminApiResponse<OrganizationDTO[]>>(
                '/api/admin/organizations'
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo organizaciones');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo organizaciones', { error });
            throw error;
        }
    }

    static async getOrganization(orgId: string): Promise<OrganizationDTO> {
        try {
            const response = await apiService.get<AdminApiResponse<OrganizationDTO>>(
                `/api/admin/organizations/${orgId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo organización');
            }

            if (!response.data.data) {
                throw new Error('Organización no encontrada');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo organización', { error, orgId });
            throw error;
        }
    }

    static async updateOrganization(orgId: string, orgData: Partial<OrganizationDTO>): Promise<OrganizationDTO> {
        try {
            const response = await apiService.put<AdminApiResponse<OrganizationDTO>>(
                `/api/admin/organizations/${orgId}`,
                orgData
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error actualizando organización');
            }

            if (!response.data.data) {
                throw new Error('Error al actualizar la organización');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error actualizando organización', { error, orgId, orgData });
            throw error;
        }
    }

    // Gestión de API Keys
    static async getApiKeys(orgId?: string): Promise<ApiKeyDTO[]> {
        try {
            const response = await apiService.get<AdminApiResponse<ApiKeyDTO[]>>(
                '/api/admin/api-keys',
                { params: { orgId } }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo API keys');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo API keys', { error, orgId });
            throw error;
        }
    }

    static async createApiKey(apiKeyData: Partial<ApiKeyDTO>): Promise<ApiKeyDTO> {
        try {
            const response = await apiService.post<AdminApiResponse<ApiKeyDTO>>(
                '/api/admin/api-keys',
                apiKeyData
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error creando API key');
            }

            if (!response.data.data) {
                throw new Error('Error al crear la API key');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error creando API key', { error, apiKeyData });
            throw error;
        }
    }

    static async updateApiKey(apiKeyId: string, apiKeyData: Partial<ApiKeyDTO>): Promise<ApiKeyDTO> {
        try {
            const response = await apiService.put<AdminApiResponse<ApiKeyDTO>>(
                `/api/admin/api-keys/${apiKeyId}`,
                apiKeyData
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error actualizando API key');
            }

            if (!response.data.data) {
                throw new Error('Error al actualizar la API key');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error actualizando API key', { error, apiKeyId, apiKeyData });
            throw error;
        }
    }

    static async revokeApiKey(apiKeyId: string): Promise<void> {
        try {
            const response = await apiService.delete<AdminApiResponse<void>>(
                `/api/admin/api-keys/${apiKeyId}`
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error revocando API key');
            }
        } catch (error) {
            logger.error('Error revocando API key', { error, apiKeyId });
            throw error;
        }
    }

    // Gestión de Feature Flags
    static async getFeatureFlags(orgId?: string): Promise<FeatureFlag[]> {
        try {
            const response = await apiService.get<AdminApiResponse<FeatureFlag[]>>(
                '/api/admin/feature-flags',
                { params: { orgId } }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo feature flags');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo feature flags', { error, orgId });
            throw error;
        }
    }

    static async updateFeatureFlag(flagId: string, flagData: Partial<FeatureFlag>): Promise<FeatureFlag> {
        try {
            const response = await apiService.put<AdminApiResponse<FeatureFlag>>(
                `/api/admin/feature-flags/${flagId}`,
                flagData
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error actualizando feature flag');
            }

            if (!response.data.data) {
                throw new Error('Error al actualizar el feature flag');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error actualizando feature flag', { error, flagId, flagData });
            throw error;
        }
    }

    // Configuración de seguridad
    static async getSecuritySettings(): Promise<SecuritySettings> {
        try {
            const response = await apiService.get<AdminApiResponse<SecuritySettings>>(
                '/api/admin/security/settings'
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo configuración de seguridad');
            }

            if (!response.data.data) {
                throw new Error('Configuración de seguridad no encontrada');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo configuración de seguridad', { error });
            throw error;
        }
    }

    static async updateSecuritySettings(settings: SecuritySettings): Promise<SecuritySettings> {
        try {
            const response = await apiService.put<AdminApiResponse<SecuritySettings>>(
                '/api/admin/security/settings',
                settings
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error actualizando configuración de seguridad');
            }

            if (!response.data.data) {
                throw new Error('Error al actualizar la configuración de seguridad');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error actualizando configuración de seguridad', { error, settings });
            throw error;
        }
    }

    // Eventos de seguridad
    static async getSecurityEvents(filters: any = {}): Promise<SecurityEventDTO[]> {
        try {
            const response = await apiService.get<AdminApiResponse<SecurityEventDTO[]>>(
                '/api/admin/security/events',
                { params: filters }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo eventos de seguridad');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo eventos de seguridad', { error, filters });
            throw error;
        }
    }

    static async resolveSecurityEvent(eventId: string, resolution: string): Promise<SecurityEventDTO> {
        try {
            const response = await apiService.post<AdminApiResponse<SecurityEventDTO>>(
                `/api/admin/security/events/${eventId}/resolve`,
                { resolution }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error resolviendo evento de seguridad');
            }

            if (!response.data.data) {
                throw new Error('Error al resolver el evento de seguridad');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error resolviendo evento de seguridad', { error, eventId, resolution });
            throw error;
        }
    }

    // Logs de auditoría
    static async getAuditLogs(filters: any = {}): Promise<AuditLogDTO[]> {
        try {
            const response = await apiService.get<AdminApiResponse<AuditLogDTO[]>>(
                '/api/admin/audit/logs',
                { params: filters }
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo logs de auditoría');
            }

            return response.data.data || [];
        } catch (error) {
            logger.error('Error obteniendo logs de auditoría', { error, filters });
            throw error;
        }
    }

    // Estadísticas de administración
    static async getAdminStats(): Promise<AdminStats> {
        try {
            const response = await apiService.get<AdminApiResponse<AdminStats>>(
                '/api/admin/stats'
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo estadísticas de administración');
            }

            if (!response.data.data) {
                throw new Error('Estadísticas no encontradas');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo estadísticas de administración', { error });
            throw error;
        }
    }

    // Configuración general
    static async getAdminSettings(): Promise<AdminSettings> {
        try {
            const response = await apiService.get<AdminApiResponse<AdminSettings>>(
                '/api/admin/settings'
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error obteniendo configuración de administración');
            }

            if (!response.data.data) {
                throw new Error('Configuración no encontrada');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error obteniendo configuración de administración', { error });
            throw error;
        }
    }

    static async updateAdminSettings(settings: AdminSettings): Promise<AdminSettings> {
        try {
            const response = await apiService.put<AdminApiResponse<AdminSettings>>(
                '/api/admin/settings',
                settings
            );

            if (!response.data.success) {
                throw new Error(response.data.error || 'Error actualizando configuración de administración');
            }

            if (!response.data.data) {
                throw new Error('Error al actualizar la configuración');
            }

            return response.data.data;
        } catch (error) {
            logger.error('Error actualizando configuración de administración', { error, settings });
            throw error;
        }
    }

    // Suscribirse a eventos en tiempo real
    static subscribeToAdminEvents(callback: (event: any) => void): () => void {
        // TODO: Implementar WebSocket para eventos en tiempo real
        logger.info('Suscribiéndose a eventos de administración');

        // Por ahora, retornar función de cleanup vacía
        return () => {
            logger.info('Desuscribiéndose de eventos de administración');
        };
    }
}
