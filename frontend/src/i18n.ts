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
        ns: ['translation'], // Especificar namespace explícitamente
        defaultNS: 'translation',
        interpolation: {
            escapeValue: false,
        },
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        react: {
            useSuspense: false // Evitar problemas de carga
        },
        // Recursos básicos por defecto inline para evitar errores
        resources: {
            es: {
                translation: {
                    loading: 'Cargando...',
                    error: 'Error',
                    welcome: 'Bienvenido',
                    login_marketing_product: 'Plataforma integral para la gestión y monitoreo inteligente de flotas y vehículos.',
                    login_feature_heading: 'Características Principales',
                    login_feat_monitor: 'Monitorear el estado y ubicación de tus vehículos.',
                    login_feat_alerts: 'Gestionar alertas, eventos y mantenimientos de forma centralizada.',
                    login_feat_reports: 'Visualizar reportes avanzados y análisis de estabilidad.',
                    login_feat_security: 'Optimizar la seguridad y eficiencia operativa de tu flota.',
                    login_feat_access: 'Acceso seguro y personalizado para cada usuario.',
                    login_benefit_heading: 'Beneficios',
                    login_benefit_efficiency: 'Aumento de la eficiencia operativa',
                    login_benefit_cost: 'Reducción de costos operativos',
                    login_benefit_security: 'Mayor seguridad y control',
                    login_footer_text: 'Plataforma desarrollada por Cosigein SL para la gestión moderna de movilidad y transporte.',
                    login_email: 'Correo electrónico',
                    login_password: 'Contraseña',
                    login_button: 'Iniciar sesión'
                }
            },
            en: {
                translation: {
                    loading: 'Loading...',
                    error: 'Error',
                    welcome: 'Welcome',
                    login_marketing_product: 'Comprehensive platform for intelligent fleet and vehicle management.',
                    login_feature_heading: 'Key Features',
                    login_feat_monitor: 'Monitor the status and location of your vehicles.',
                    login_feat_alerts: 'Manage alerts, events, and maintenance from a single place.',
                    login_feat_reports: 'View advanced reports and stability analysis.',
                    login_feat_security: 'Optimize fleet safety and operational efficiency.',
                    login_feat_access: 'Secure, role-based access for every user.',
                    login_benefit_heading: 'Benefits',
                    login_benefit_efficiency: 'Increased operational efficiency',
                    login_benefit_cost: 'Reduced operational costs',
                    login_benefit_security: 'Greater safety and control',
                    login_footer_text: 'Platform developed by Cosigein SL for modern mobility and transport management.',
                    login_email: 'Email',
                    login_password: 'Password',
                    login_button: 'Log in'
                }
            },
            fr: {
                translation: {
                    loading: 'Chargement...',
                    error: 'Erreur',
                    welcome: 'Bienvenue',
                    login_marketing_product: 'Plateforme complète pour la gestion intelligente des flottes et des véhicules.',
                    login_feature_heading: 'Fonctionnalités clés',
                    login_feat_monitor: 'Surveillez l’état et la localisation de vos véhicules.',
                    login_feat_alerts: 'Gérez alertes, événements et maintenance depuis un seul endroit.',
                    login_feat_reports: 'Affichez des rapports avancés et des analyses de stabilité.',
                    login_feat_security: 'Optimisez la sécurité et l’efficacité opérationnelle de votre flotte.',
                    login_feat_access: 'Accès sécurisé et personnalisé pour chaque utilisateur.',
                    login_benefit_heading: 'Avantages',
                    login_benefit_efficiency: 'Efficacité opérationnelle accrue',
                    login_benefit_cost: 'Réduction des coûts opérationnels',
                    login_benefit_security: 'Plus grande sécurité et contrôle',
                    login_footer_text: 'Plateforme développée par Cosigein SL pour la mobilité et le transport modernes.',
                    login_email: 'Courriel',
                    login_password: 'Mot de passe',
                    login_button: 'Connexion'
                }
            }
        },
        // Configuración adicional para evitar errores de claves faltantes
        saveMissing: false,
        returnEmptyString: false,
        returnNull: false,
        missingKeyHandler: (_lng, _ns, key, fallbackValue) => {
            // Devolver la clave como fallback para debugging
            return fallbackValue || key;
        },
        // Evitar errores cuando faltan traducciones
        parseMissingKeyHandler: (key) => {
            return key;
        }
    }).catch((error) => {
        // Silenciar errores de inicialización de i18n
        console.warn('i18n initialization warning:', error);
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