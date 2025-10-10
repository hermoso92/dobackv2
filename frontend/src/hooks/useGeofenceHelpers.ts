/**
 * Hook con funciones helper para geofences (reglas de negocio)
 */
export const useGeofenceHelpers = () => {
    const getGeofenceColor = (geofence: any): string => {
        if (!geofence.enabled) return '#9e9e9e';
        if (geofence.live) return '#4caf50';
        return '#2196f3';
    };

    const getPriorityFromTag = (tag?: string): 'low' | 'medium' | 'high' | 'critical' => {
        if (!tag) return 'low';
        switch (tag) {
            case 'CENTRAL':
            case 'GRAN_VIA':
                return 'critical';
            case 'CHAMBERI':
            case 'CARABANCHEL':
                return 'high';
            case 'VALLECAS':
            case 'RETIRO':
                return 'medium';
            default:
                return 'low';
        }
    };

    const getDepartmentFromTag = (tag?: string): string => {
        if (!tag) return 'General';
        switch (tag) {
            case 'CENTRAL':
                return 'Central';
            case 'CHAMBERI':
                return 'Chamberí';
            case 'GRAN_VIA':
                return 'Centro';
            case 'VALLECAS':
                return 'Vallecas';
            case 'CARABANCHEL':
                return 'Carabanchel';
            case 'RETIRO':
                return 'Retiro';
            default:
                return 'General';
        }
    };

    const getModeText = (mode: string): string => {
        switch (mode) {
            case 'CAR': return 'Vehículo';
            case 'FOOT': return 'Peatón';
            case 'BIKE': return 'Bicicleta';
            case 'ALL': return 'Todos';
            default: return mode;
        }
    };

    return {
        getGeofenceColor,
        getPriorityFromTag,
        getDepartmentFromTag,
        getModeText
    };
};

