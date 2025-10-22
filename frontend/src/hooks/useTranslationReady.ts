import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '../utils/logger';

/**
 * Hook personalizado para manejar el estado de carga de traducciones
 * Evita que los componentes se rendericen antes de que las traducciones estén listas
 */
export const useTranslationReady = () => {
    const { i18n } = useTranslation();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const checkReady = () => {
            // Verificar si i18n está inicializado y las traducciones están cargadas
            if (i18n.isInitialized && i18n.hasResourceBundle(i18n.language, 'translation')) {
                setIsReady(true);
            } else {
                setIsReady(false);
            }
        };

        // Verificar inmediatamente
        checkReady();

        // Escuchar cambios en el estado de i18n
        const handleInitialized = () => {
            checkReady();
        };

        const handleLanguageChanged = () => {
            checkReady();
        };

        const handleLoaded = () => {
            checkReady();
        };

        // Agregar listeners
        i18n.on('initialized', handleInitialized);
        i18n.on('languageChanged', handleLanguageChanged);
        i18n.on('loaded', handleLoaded);

        // Cleanup
        return () => {
            i18n.off('initialized', handleInitialized);
            i18n.off('languageChanged', handleLanguageChanged);
            i18n.off('loaded', handleLoaded);
        };
    }, [i18n]);

    return isReady;
};

/**
 * Hook que proporciona traducciones seguras
 * Retorna la función t y un estado de carga
 */
export const useSafeTranslation = () => {
    const { t, i18n } = useTranslation();
    const isReady = useTranslationReady();

    // Función de traducción segura que maneja claves faltantes
    const safeT = (key: string, options?: any) => {
        if (!isReady) {
            return key; // Retornar la clave si no está listo
        }

        const translation = t(key, options);

        // Si la traducción es igual a la clave, significa que no se encontró
        if (translation === key) {
            logger.warn(`⚠️ Traducción faltante: ${key}`);
            return key; // Retornar la clave como fallback
        }

        return translation;
    };

    return {
        t: safeT,
        i18n,
        isReady,
        isLoading: !isReady
    };
};
