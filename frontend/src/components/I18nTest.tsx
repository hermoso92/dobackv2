import React from 'react';
import { useTranslation } from 'react-i18next';

const I18nTest: React.FC = () => {
    const { t, ready, i18n } = useTranslation();

    if (!ready) {
        return <div>🔄 Cargando traducciones...</div>;
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace' }}>
            <h3>🧪 Test de i18n</h3>
            <p><strong>Idioma actual:</strong> {i18n.language}</p>
            <p><strong>i18n inicializado:</strong> {i18n.isInitialized ? '✅ Sí' : '❌ No'}</p>
            <p><strong>Traducciones listas:</strong> {ready ? '✅ Sí' : '❌ No'}</p>

            <h4>🔍 Pruebas de traducción:</h4>
            <ul>
                <li><strong>doback_soft_v2:</strong> "{t('doback_soft_v2')}"</li>
                <li><strong>estabilidad:</strong> "{t('estabilidad')}"</li>
                <li><strong>telemetria_1:</strong> "{t('telemetria_1')}"</li>
                <li><strong>modo_oscuro:</strong> "{t('modo_oscuro')}"</li>
                <li><strong>perfil:</strong> "{t('perfil')}"</li>
                <li><strong>ajustes:</strong> "{t('ajustes')}"</li>
                <li><strong>cargando_2:</strong> "{t('cargando_2')}"</li>
            </ul>

            <h4>🌍 Idiomas disponibles:</h4>
            <ul>
                {i18n.languages.map(lang => (
                    <li key={lang}>{lang} {lang === i18n.language ? '✅' : ''}</li>
                ))}
            </ul>
        </div>
    );
};

export default I18nTest; 