/**
 * Mensaje de error mejorado para problemas de conexión
 * DobackSoft - Sistema de Monitoreo de Estabilidad
 */

export const CONNECTION_ERROR_MESSAGES = {
    TIMEOUT: {
        title: '⏱️ Timeout de Conexión',
        message: 'El servidor está tardando demasiado en responder.',
        solutions: [
            'Verificar que el backend esté ejecutándose en el puerto 9998',
            'Comprobar la conexión a internet',
            'Reintentar la operación en unos segundos'
        ]
    },
    NETWORK_ERROR: {
        title: '🌐 Error de Red',
        message: 'No se puede conectar con el servidor.',
        solutions: [
            'Verificar que el backend esté iniciado: cd backend && npm run dev',
            'Comprobar que el puerto 9998 esté disponible',
            'Revisar la configuración de firewall'
        ]
    },
    SERVER_ERROR: {
        title: '🔧 Error del Servidor',
        message: 'El servidor ha devuelto un error.',
        solutions: [
            'Revisar los logs del backend',
            'Verificar la configuración de la base de datos',
            'Contactar al administrador del sistema'
        ]
    },
    AUTH_ERROR: {
        title: '🔐 Error de Autenticación',
        message: 'Credenciales incorrectas o sesión expirada.',
        solutions: [
            'Verificar usuario y contraseña',
            'Intentar iniciar sesión nuevamente',
            'Contactar al administrador si el problema persiste'
        ]
    }
};

export function getConnectionErrorMessage(error: any) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return CONNECTION_ERROR_MESSAGES.TIMEOUT;
    }

    if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        return CONNECTION_ERROR_MESSAGES.NETWORK_ERROR;
    }

    if (error.response?.status >= 500) {
        return CONNECTION_ERROR_MESSAGES.SERVER_ERROR;
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
        return CONNECTION_ERROR_MESSAGES.AUTH_ERROR;
    }

    return {
        title: '❌ Error Desconocido',
        message: error.message || 'Ha ocurrido un error inesperado.',
        solutions: [
            'Recargar la página',
            'Verificar la conexión a internet',
            'Contactar al soporte técnico'
        ]
    };
}

export function formatErrorMessage(error: any): string {
    const errorInfo = getConnectionErrorMessage(error);

    let message = `${errorInfo.title}\n\n${errorInfo.message}\n\nSoluciones:\n`;

    errorInfo.solutions.forEach((solution, index) => {
        message += `${index + 1}. ${solution}\n`;
    });

    return message;
}
