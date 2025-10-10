import { MenuItem, Select, SelectChangeEvent, Tooltip } from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { getAvailableLanguages, getLang, setLang } from '../i18n';

type Lang = 'es' | 'en' | 'fr';

const LanguageSwitcher: React.FC = () => {
    const { t } = useTranslation();
    const [lang, setLangState] = React.useState<Lang>(getLang() as Lang);
    const availableLanguages = getAvailableLanguages();

    const handleChange = (event: SelectChangeEvent) => {
        const newLang = event.target.value as Lang;
        setLangState(newLang);
        setLang(newLang);
    };

    const getCurrentLanguageInfo = () => {
        return availableLanguages.find(l => l.code === lang) || availableLanguages[0];
    };

    const currentLang = getCurrentLanguageInfo();

    return (
        <Tooltip title={`Idioma actual: ${currentLang.name}`} arrow>
            <Select
                value={lang}
                onChange={handleChange}
                size="small"
                variant="standard"
                disableUnderline
                sx={{
                    color: 'inherit',
                    '.MuiSelect-icon': { color: 'inherit' },
                    mr: 2,
                    minWidth: 80,
                    '& .MuiSelect-select': {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                    }
                }}
                renderValue={(value) => {
                    const selectedLang = availableLanguages.find(l => l.code === value);
                    return (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>{selectedLang?.flag}</span>
                            <span>{selectedLang?.code.toUpperCase()}</span>
                        </span>
                    );
                }}
            >
                {availableLanguages.map((language) => (
                    <MenuItem key={language.code} value={language.code}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>{language.flag}</span>
                            <span>{language.name}</span>
                        </span>
                    </MenuItem>
                ))}
            </Select>
        </Tooltip>
    );
};

export default LanguageSwitcher; 