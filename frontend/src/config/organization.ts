/**
 * Configuración de la organización única del sistema
 * 
 * NOTA: Esta aplicación trabaja con una sola organización (Bomberos Madrid).
 * Este ID se usa como fallback cuando el usuario no tiene organizationId asignado.
 */

// ID de la organización principal: Bomberos Madrid
export const DEFAULT_ORGANIZATION_ID = 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26';

/**
 * Obtiene el organizationId a usar en las peticiones
 * Prioriza el organizationId del usuario, si no está disponible usa el default
 */
export function getOrganizationId(userOrganizationId?: string | null): string {
    return userOrganizationId || DEFAULT_ORGANIZATION_ID;
}

