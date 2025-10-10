import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

// LIMPIAR COMPLETAMENTE EL LOCALSTORAGE DE IDIOMAS
const clearAllLanguageSettings = (): void => {
    // Lista de claves conocidas que pueden interferir
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
            localStorage.removeItem(key);
        }
    });

    // Buscar y eliminar cualquier clave que contenga 'i18n', 'lng' o 'lang'
    Object.keys(localStorage).forEach(key => {
        if (key.toLowerCase().includes('i18n') ||
            key.toLowerCase().includes('lng') ||
            key.toLowerCase().includes('lang')) {
            localStorage.removeItem(key);
        }
    });
};

// Función SIMPLIFICADA para detectar idioma
const getLanguage = (): string => {
    // SIEMPRE limpiar primero
    clearAllLanguageSettings();

    try {
        // Obtener información del usuario
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const browserLanguage = navigator.language || 'es-ES';

        // SOLO detectar Francia e Inglaterra específicamente
        // Todo lo demás va a español
        if (timezone === 'Europe/Paris' || browserLanguage.startsWith('fr')) {
            return 'fr';
        }

        if (timezone === 'Europe/London' || browserLanguage.startsWith('en-GB')) {
            return 'en';
        }

        // Para Estados Unidos y otros países de habla inglesa
        if (browserLanguage.startsWith('en-US') ||
            timezone.includes('America/New_York') ||
            timezone.includes('America/Los_Angeles')) {
            return 'en';
        }

        // TODOS LOS DEMÁS CASOS → ESPAÑOL
        return 'es';

    } catch (error) {
        return 'es';
    }
};

// Detectar idioma
const selectedLanguage = getLanguage();

// Configuración de i18n en modo producción
i18n
    .use(Backend)
    .use(initReactI18next)
    .init({
        fallbackLng: 'es',
        lng: selectedLanguage,
        debug: false,
        interpolation: {
            escapeValue: false,
        },
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        react: {
            useSuspense: false // Evitar problemas de carga
        },
        // Recursos por defecto para evitar el error de 'messages'
        resources: {
            es: {
                translation: {}
            },
            en: {
                translation: {}
            },
            fr: {
                translation: {}
            }
        },
        // Configuración adicional para evitar errores de claves faltantes
        saveMissing: false,
        returnEmptyString: false,
        returnNull: false,
        missingKeyHandler: (_lng, _ns, key, fallbackValue) => {
            // No mostrar warnings para claves de login que sabemos que existen
            if (key.startsWith('login_')) {
                return fallbackValue || key;
            }
            return fallbackValue || key;
        }
    });

// FORZAR el idioma seleccionado
i18n.changeLanguage(selectedLanguage).catch(() => {
    // Ignorar errores de cambio de idioma
});

// Función para obtener el idioma actual
export const getLang = (): string => {
    return i18n.language;
};

// Función para cambiar el idioma manualmente
export const setLang = (lang: string): void => {
    i18n.changeLanguage(lang);
    // SOLO guardar si es un cambio manual del usuario
    localStorage.setItem('dobacksoft_language', lang);
};

// Función para FORZAR español (para debugging)
export const forceSpanish = (): void => {
    clearAllLanguageSettings();
    i18n.changeLanguage('es');
    location.reload(); // Recargar página para aplicar cambios
};

// Función para obtener la traducción con mejor manejo de errores
export const t = (key: string, options?: any): string => {
    try {
        const translation = i18n.t(key, options);
        return translation as string;
    } catch (error) {
        return key;
    }
};

// Función para obtener idiomas disponibles
export const getAvailableLanguages = (): { code: string; name: string; flag: string }[] => {
    return [
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' }
    ];
};

// Exponer funciones para debugging en consola (solo en desarrollo)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
    (window as any).dobackDebug = {
        forceSpanish,
        clearAllLanguageSettings,
        showCurrentLanguage: () => {
            console.log(`Idioma actual: ${i18n.language}`);
            console.log(`i18n inicializado: ${i18n.isInitialized}`);
        }
    };
}

export default i18n; 