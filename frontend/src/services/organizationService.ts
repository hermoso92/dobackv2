import { logger } from '../utils/logger';

// Tipos para información de organización
export interface OrganizationInfo {
    id: string;
    name: string;
    timezone: string;
    settings: {
        language: string;
        theme: string;
        timezone: string;
    };
}

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId: string;
    organization: OrganizationInfo;
}

class OrganizationService {
    private cachedProfile: UserProfile | null = null;
    private cacheExpiry: number = 0;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

    /**
     * Obtiene el perfil del usuario actual incluyendo información de organización
     * Sin leer directamente del JWT, hace llamada al backend
     */
    async getUserProfile(): Promise<UserProfile> {
        // Verificar caché
        if (this.cachedProfile && Date.now() < this.cacheExpiry) {
            logger.debug('Retornando perfil desde caché');
            return this.cachedProfile;
        }

        try {
            const response = await fetch('/api/user/profile', {
                method: 'GET',
                credentials: 'include', // Usar cookies httpOnly
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const profile = await response.json();

            // Actualizar caché
            this.cachedProfile = profile;
            this.cacheExpiry = Date.now() + this.CACHE_DURATION;

            logger.info('Perfil de usuario obtenido:', {
                userId: profile.id,
                organizationId: profile.organizationId
            });

            return profile;

        } catch (error) {
            logger.error('Error obteniendo perfil de usuario:', error);
            throw new Error('No se pudo obtener la información del usuario');
        }
    }

    /**
     * Obtiene solo el ID de la organización del usuario
     */
    async getOrganizationId(): Promise<string> {
        const profile = await this.getUserProfile();
        return profile.organizationId;
    }

    /**
     * Obtiene información completa de la organización
     */
    async getOrganizationInfo(): Promise<OrganizationInfo> {
        const profile = await this.getUserProfile();
        return profile.organization;
    }

    /**
     * Obtiene la zona horaria de la organización del usuario
     */
    async getOrganizationTimezone(): Promise<string> {
        const organization = await this.getOrganizationInfo();
        return organization.timezone;
    }

    /**
     * Obtiene los ajustes de la organización
     */
    async getOrganizationSettings(): Promise<{ language: string; theme: string; timezone: string }> {
        const organization = await this.getOrganizationInfo();
        return organization.settings;
    }

    /**
     * Verifica si el usuario tiene acceso a una organización específica
     */
    async hasAccessToOrganization(organizationId: string): Promise<boolean> {
        try {
            const userOrgId = await this.getOrganizationId();
            return userOrgId === organizationId;
        } catch (error) {
            logger.error('Error verificando acceso a organización:', error);
            return false;
        }
    }

    /**
     * Limpia la caché del servicio
     */
    clearCache(): void {
        this.cachedProfile = null;
        this.cacheExpiry = 0;
        logger.debug('Caché de organización limpiado');
    }

    /**
     * Actualiza la configuración de la organización
     */
    async updateOrganizationSettings(settings: Partial<{ language: string; theme: string; timezone: string }>): Promise<void> {
        try {
            // TODO: Reemplazar con llamada real al backend
            // const response = await fetch('/api/organization/settings', {
            //     method: 'PUT',
            //     credentials: 'include',
            //     headers: {
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify(settings)
            // });

            // if (!response.ok) {
            //     throw new Error(`HTTP error! status: ${response.status}`);
            // }

            // Limpiar caché para forzar recarga
            this.clearCache();

            logger.info('Configuración de organización actualizada:', settings);

        } catch (error) {
            logger.error('Error actualizando configuración de organización:', error);
            throw new Error('No se pudo actualizar la configuración');
        }
    }

    /**
     * Obtiene la lista de vehículos de la organización
     */
    async getOrganizationVehicles(): Promise<Array<{ id: string; name: string; plate: string; type: string }>> {
        try {
            const organizationId = await this.getOrganizationId();

            const response = await fetch(`/api/telemetry/organization-info?organizationId=${organizationId}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const vehicles = data.data?.vehicles || [];

            logger.info('Vehículos de organización obtenidos:', {
                organizationId,
                count: vehicles.length
            });

            return vehicles;

        } catch (error) {
            logger.error('Error obteniendo vehículos de organización:', error);
            throw new Error('No se pudieron obtener los vehículos');
        }
    }

    /**
     * Obtiene la lista de parques de la organización
     */
    async getOrganizationParks(): Promise<Array<{ id: string; name: string; address: string }>> {
        try {
            const organizationId = await this.getOrganizationId();

            const response = await fetch(`/api/telemetry/organization-info?organizationId=${organizationId}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const parks = data.data?.parks || [];

            logger.info('Parques de organización obtenidos:', {
                organizationId,
                count: parks.length
            });

            return parks;

        } catch (error) {
            logger.error('Error obteniendo parques de organización:', error);
            throw new Error('No se pudieron obtener los parques');
        }
    }
}

// Instancia singleton del servicio
export const organizationService = new OrganizationService();

// Hook para usar el servicio en componentes React
export const useOrganization = () => {
    return {
        getUserProfile: () => organizationService.getUserProfile(),
        getOrganizationId: () => organizationService.getOrganizationId(),
        getOrganizationInfo: () => organizationService.getOrganizationInfo(),
        getOrganizationTimezone: () => organizationService.getOrganizationTimezone(),
        getOrganizationSettings: () => organizationService.getOrganizationSettings(),
        hasAccessToOrganization: (orgId: string) => organizationService.hasAccessToOrganization(orgId),
        getOrganizationVehicles: () => organizationService.getOrganizationVehicles(),
        getOrganizationParks: () => organizationService.getOrganizationParks(),
        updateOrganizationSettings: (settings: Partial<{ language: string; theme: string; timezone: string }>) =>
            organizationService.updateOrganizationSettings(settings),
        clearCache: () => organizationService.clearCache()
    };
};

export default organizationService;
