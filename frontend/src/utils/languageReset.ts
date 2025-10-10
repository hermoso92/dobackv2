// Utilidad para resetear completamente la configuración de idioma a español

export const resetLanguageToSpanish = (): void => {
    console.log('🔄 Reseteando idioma a español...');

    try {
        // Limpiar todas las claves relacionadas con idioma
        const keysToRemove = [
            'dobacksoft_language',
            'i18nextLng',
            'i18next_lng',
            'lng',
            'language',
            'locale'
        ];

        keysToRemove.forEach(key => {
            if (localStorage.getItem(key)) {
                console.log(`🧹 Eliminando: ${key} = ${localStorage.getItem(key)}`);
                localStorage.removeItem(key);
            }
        });

        // Limpiar cualquier otra clave que contenga 'i18n' o 'lng'
        Object.keys(localStorage).forEach(key => {
            if (key.includes('i18n') || key.includes('lng') || key.includes('lang')) {
                console.log(`🧹 Eliminando clave sospechosa: ${key} = ${localStorage.getItem(key)}`);
                localStorage.removeItem(key);
            }
        });

        // Establecer español explícitamente
        localStorage.setItem('dobacksoft_language', 'es');

        console.log('✅ Idioma reseteado a español');
        console.log('🔄 Recarga la página para aplicar los cambios');

    } catch (error) {
        console.error('❌ Error reseteando idioma:', error);
    }
};

// Función para mostrar el estado actual del localStorage
export const showLanguageState = (): void => {
    console.log('📊 Estado actual del localStorage:');

    Object.keys(localStorage).forEach(key => {
        const value = localStorage.getItem(key);
        if (key.includes('lang') || key.includes('i18n') || key.includes('lng') || key === 'dobacksoft_language') {
            console.log(`  ${key}: ${value}`);
        }
    });

    console.log(`🌐 Idioma del navegador: ${navigator.language}`);
    console.log(`🌍 Zona horaria: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
};

// Exponer funciones globalmente para debugging
if (typeof window !== 'undefined') {
    (window as any).resetLanguageToSpanish = resetLanguageToSpanish;
    (window as any).showLanguageState = showLanguageState;
} 