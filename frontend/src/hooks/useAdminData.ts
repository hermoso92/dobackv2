import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminAPI } from '../api/admin';
import { logger } from '../utils/logger';

export const useAdminData = () => {
    const queryClient = useQueryClient();

    // Gestión de usuarios
    const useUsers = (filters: any = {}) => {
        return useQuery({
            queryKey: ['admin-users', filters],
            queryFn: () => AdminAPI.getUsers(filters),
            staleTime: 2 * 60 * 1000, // 2 minutos
            gcTime: 10 * 60 * 1000, // 10 minutos
        });
    };

    const useUser = (userId: string) => {
        return useQuery({
            queryKey: ['admin-user', userId],
            queryFn: () => AdminAPI.getUser(userId),
            enabled: !!userId,
            staleTime: 5 * 60 * 1000, // 5 minutos
            gcTime: 15 * 60 * 1000, // 15 minutos
        });
    };

    const useCreateUser = () => {
        return useMutation({
            mutationFn: (userData: any) => AdminAPI.createUser(userData),
            onSuccess: (data) => {
                logger.info('Usuario creado exitosamente', { userId: data.id });
                queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            },
            onError: (error) => {
                logger.error('Error creando usuario', { error });
            },
        });
    };

    const useUpdateUser = () => {
        return useMutation({
            mutationFn: ({ userId, userData }: { userId: string; userData: any }) =>
                AdminAPI.updateUser(userId, userData),
            onSuccess: (data, { userId }) => {
                logger.info('Usuario actualizado exitosamente', { userId });
                queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
                queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            },
            onError: (error) => {
                logger.error('Error actualizando usuario', { error });
            },
        });
    };

    const useDeleteUser = () => {
        return useMutation({
            mutationFn: (userId: string) => AdminAPI.deleteUser(userId),
            onSuccess: (_, userId) => {
                logger.info('Usuario eliminado exitosamente', { userId });
                queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            },
            onError: (error) => {
                logger.error('Error eliminando usuario', { error });
            },
        });
    };

    // Gestión de organizaciones
    const useOrganizations = () => {
        return useQuery({
            queryKey: ['admin-organizations'],
            queryFn: () => AdminAPI.getOrganizations(),
            staleTime: 5 * 60 * 1000, // 5 minutos
            gcTime: 15 * 60 * 1000, // 15 minutos
        });
    };

    const useOrganization = (orgId: string) => {
        return useQuery({
            queryKey: ['admin-organization', orgId],
            queryFn: () => AdminAPI.getOrganization(orgId),
            enabled: !!orgId,
            staleTime: 5 * 60 * 1000, // 5 minutos
            gcTime: 15 * 60 * 1000, // 15 minutos
        });
    };

    const useUpdateOrganization = () => {
        return useMutation({
            mutationFn: ({ orgId, orgData }: { orgId: string; orgData: any }) =>
                AdminAPI.updateOrganization(orgId, orgData),
            onSuccess: (data, { orgId }) => {
                logger.info('Organización actualizada exitosamente', { orgId });
                queryClient.invalidateQueries({ queryKey: ['admin-organization', orgId] });
                queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
            },
            onError: (error) => {
                logger.error('Error actualizando organización', { error });
            },
        });
    };

    // Gestión de API Keys
    const useApiKeys = (orgId?: string) => {
        return useQuery({
            queryKey: ['admin-api-keys', orgId],
            queryFn: () => AdminAPI.getApiKeys(orgId),
            staleTime: 2 * 60 * 1000, // 2 minutos
            gcTime: 10 * 60 * 1000, // 10 minutos
        });
    };

    const useCreateApiKey = () => {
        return useMutation({
            mutationFn: (apiKeyData: any) => AdminAPI.createApiKey(apiKeyData),
            onSuccess: (data) => {
                logger.info('API key creada exitosamente', { apiKeyId: data.id });
                queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
            },
            onError: (error) => {
                logger.error('Error creando API key', { error });
            },
        });
    };

    const useUpdateApiKey = () => {
        return useMutation({
            mutationFn: ({ apiKeyId, apiKeyData }: { apiKeyId: string; apiKeyData: any }) =>
                AdminAPI.updateApiKey(apiKeyId, apiKeyData),
            onSuccess: (data, { apiKeyId }) => {
                logger.info('API key actualizada exitosamente', { apiKeyId });
                queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
            },
            onError: (error) => {
                logger.error('Error actualizando API key', { error });
            },
        });
    };

    const useRevokeApiKey = () => {
        return useMutation({
            mutationFn: (apiKeyId: string) => AdminAPI.revokeApiKey(apiKeyId),
            onSuccess: (_, apiKeyId) => {
                logger.info('API key revocada exitosamente', { apiKeyId });
                queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
            },
            onError: (error) => {
                logger.error('Error revocando API key', { error });
            },
        });
    };

    // Gestión de Feature Flags
    const useFeatureFlags = (orgId?: string) => {
        return useQuery({
            queryKey: ['admin-feature-flags', orgId],
            queryFn: () => AdminAPI.getFeatureFlags(orgId),
            staleTime: 1 * 60 * 1000, // 1 minuto
            gcTime: 5 * 60 * 1000, // 5 minutos
        });
    };

    const useUpdateFeatureFlag = () => {
        return useMutation({
            mutationFn: ({ flagId, flagData }: { flagId: string; flagData: any }) =>
                AdminAPI.updateFeatureFlag(flagId, flagData),
            onSuccess: (data, { flagId }) => {
                logger.info('Feature flag actualizado exitosamente', { flagId });
                queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
            },
            onError: (error) => {
                logger.error('Error actualizando feature flag', { error });
            },
        });
    };

    // Configuración de seguridad
    const useSecuritySettings = () => {
        return useQuery({
            queryKey: ['admin-security-settings'],
            queryFn: () => AdminAPI.getSecuritySettings(),
            staleTime: 5 * 60 * 1000, // 5 minutos
            gcTime: 15 * 60 * 1000, // 15 minutos
        });
    };

    const useUpdateSecuritySettings = () => {
        return useMutation({
            mutationFn: (settings: any) => AdminAPI.updateSecuritySettings(settings),
            onSuccess: (data) => {
                logger.info('Configuración de seguridad actualizada', { settings: data });
                queryClient.invalidateQueries({ queryKey: ['admin-security-settings'] });
            },
            onError: (error) => {
                logger.error('Error actualizando configuración de seguridad', { error });
            },
        });
    };

    // Eventos de seguridad
    const useSecurityEvents = (filters: any = {}) => {
        return useQuery({
            queryKey: ['admin-security-events', filters],
            queryFn: () => AdminAPI.getSecurityEvents(filters),
            staleTime: 1 * 60 * 1000, // 1 minuto
            gcTime: 5 * 60 * 1000, // 5 minutos
        });
    };

    const useResolveSecurityEvent = () => {
        return useMutation({
            mutationFn: ({ eventId, resolution }: { eventId: string; resolution: string }) =>
                AdminAPI.resolveSecurityEvent(eventId, resolution),
            onSuccess: (data, { eventId }) => {
                logger.info('Evento de seguridad resuelto', { eventId });
                queryClient.invalidateQueries({ queryKey: ['admin-security-events'] });
            },
            onError: (error) => {
                logger.error('Error resolviendo evento de seguridad', { error });
            },
        });
    };

    // Logs de auditoría
    const useAuditLogs = (filters: any = {}) => {
        return useQuery({
            queryKey: ['admin-audit-logs', filters],
            queryFn: () => AdminAPI.getAuditLogs(filters),
            staleTime: 1 * 60 * 1000, // 1 minuto
            gcTime: 5 * 60 * 1000, // 5 minutos
        });
    };

    // Estadísticas de administración
    const useAdminStats = () => {
        return useQuery({
            queryKey: ['admin-stats'],
            queryFn: () => AdminAPI.getAdminStats(),
            staleTime: 2 * 60 * 1000, // 2 minutos
            gcTime: 10 * 60 * 1000, // 10 minutos
        });
    };

    // Configuración general
    const useAdminSettings = () => {
        return useQuery({
            queryKey: ['admin-settings'],
            queryFn: () => AdminAPI.getAdminSettings(),
            staleTime: 5 * 60 * 1000, // 5 minutos
            gcTime: 15 * 60 * 1000, // 15 minutos
        });
    };

    const useUpdateAdminSettings = () => {
        return useMutation({
            mutationFn: (settings: any) => AdminAPI.updateAdminSettings(settings),
            onSuccess: (data) => {
                logger.info('Configuración de administración actualizada', { settings: data });
                queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            },
            onError: (error) => {
                logger.error('Error actualizando configuración de administración', { error });
            },
        });
    };

    // Utilidades
    const invalidateAdminCache = () => {
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
        queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
        queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
        queryClient.invalidateQueries({ queryKey: ['admin-security-events'] });
        queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    };

    const invalidateUserCache = (userId: string) => {
        queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    };

    const invalidateOrganizationCache = (orgId: string) => {
        queryClient.invalidateQueries({ queryKey: ['admin-organization', orgId] });
        queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
    };

    return {
        // Usuarios
        useUsers,
        useUser,
        useCreateUser,
        useUpdateUser,
        useDeleteUser,

        // Organizaciones
        useOrganizations,
        useOrganization,
        useUpdateOrganization,

        // API Keys
        useApiKeys,
        useCreateApiKey,
        useUpdateApiKey,
        useRevokeApiKey,

        // Feature Flags
        useFeatureFlags,
        useUpdateFeatureFlag,

        // Seguridad
        useSecuritySettings,
        useUpdateSecuritySettings,
        useSecurityEvents,
        useResolveSecurityEvent,

        // Auditoría
        useAuditLogs,

        // Estadísticas y configuración
        useAdminStats,
        useAdminSettings,
        useUpdateAdminSettings,

        // Utilidades
        invalidateAdminCache,
        invalidateUserCache,
        invalidateOrganizationCache,
    };
};
