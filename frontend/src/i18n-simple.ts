import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

// LIMPIAR COMPLETAMENTE EL LOCALSTORAGE DE IDIOMAS
const clearAllLanguageSettings = (): void => {
    console.log('🧹 Limpiando TODAS las configuraciones de idioma...');

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
            console.log(`🗑️ Eliminando: ${key} = ${localStorage.getItem(key)}`);
            localStorage.removeItem(key);
        }
    });

    // Buscar y eliminar cualquier clave que contenga 'i18n', 'lng' o 'lang'
    Object.keys(localStorage).forEach(key => {
        if (key.toLowerCase().includes('i18n') ||
            key.toLowerCase().includes('lng') ||
            key.toLowerCase().includes('lang')) {
            console.log(`🗑️ Eliminando clave sospechosa: ${key} = ${localStorage.getItem(key)}`);
            localStorage.removeItem(key);
        }
    });
};

// Función SIMPLIFICADA para detectar idioma
const getLanguage = (): string => {
    // SIEMPRE limpiar primero
    clearAllLanguageSettings();

    console.log('🌍 Iniciando detección de idioma...');

    try {
        // Obtener información del usuario
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const browserLanguage = navigator.language || 'es-ES';

        console.log(`🌍 Zona horaria: ${timezone}`);
        console.log(`🌐 Idioma navegador: ${browserLanguage}`);

        // SOLO detectar Francia e Inglaterra específicamente
        // Todo lo demás va a español
        if (timezone === 'Europe/Paris' || browserLanguage.startsWith('fr')) {
            console.log('🇫🇷 Usuario en Francia detectado → Francés');
            return 'fr';
        }

        if (timezone === 'Europe/London' || browserLanguage.startsWith('en-GB')) {
            console.log('🇬🇧 Usuario en Reino Unido detectado → Inglés');
            return 'en';
        }

        // Para Estados Unidos y otros países de habla inglesa
        if (browserLanguage.startsWith('en-US') ||
            timezone.includes('America/New_York') ||
            timezone.includes('America/Los_Angeles')) {
            console.log('🇺🇸 Usuario en Estados Unidos detectado → Inglés');
            return 'en';
        }

        // TODOS LOS DEMÁS CASOS → ESPAÑOL
        console.log('🇪🇸 Usando español como predeterminado');
        return 'es';

    } catch (error) {
        console.warn('⚠️ Error en detección, usando español:', error);
        return 'es';
    }
};

// Detectar idioma
const selectedLanguage = getLanguage();

console.log(`✅ Idioma seleccionado: ${selectedLanguage.toUpperCase()}`);

// Configuración de i18n MUY SIMPLE
i18n
    .use(Backend)
    .use(initReactI18next)
    .init({
        fallbackLng: 'es',
        lng: selectedLanguage,
        debug: true, // Para ver qué está pasando
        interpolation: {
            escapeValue: false,
        },
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        react: {
            useSuspense: false
        }
    });

// FORZAR el idioma seleccionado
i18n.changeLanguage(selectedLanguage);

console.log(`🎯 Doback Soft iniciado en: ${selectedLanguage.toUpperCase()}`);

// Función para obtener el idioma actual
export const getLang = (): string => {
    return i18n.language;
};

// Función para cambiar el idioma manualmente
export const setLang = (lang: string): void => {
    console.log(`🔄 Cambiando idioma manualmente a: ${lang.toUpperCase()}`);
    i18n.changeLanguage(lang);
    // SOLO guardar si es un cambio manual del usuario
    localStorage.setItem('dobacksoft_language', lang);
};

// Función para FORZAR español (para debugging)
export const forceSpanish = (): void => {
    console.log('🇪🇸 FORZANDO ESPAÑOL');
    clearAllLanguageSettings();
    i18n.changeLanguage('es');
    location.reload(); // Recargar página para aplicar cambios
};

// Función para obtener la traducción
export const t = (key: string, options?: any): string => {
    return i18n.t(key, options) as string;
};

// Función para obtener idiomas disponibles
export const getAvailableLanguages = (): { code: string; name: string; flag: string }[] => {
    return [
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' }
    ];
};

// Exponer funciones para debugging en consola
if (typeof window !== 'undefined') {
    (window as any).forceSpanish = forceSpanish;
    (window as any).clearAllLanguageSettings = clearAllLanguageSettings;
    (window as any).showCurrentLanguage = () => {
        console.log(`Idioma actual: ${i18n.language}`);
        console.log(`LocalStorage:`, Object.keys(localStorage).filter(k =>
            k.includes('lang') || k.includes('i18n')
        ).map(k => `${k}: ${localStorage.getItem(k)}`));
    };
}

export default i18n; 