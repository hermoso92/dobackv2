import { Brightness4, Brightness7 } from '@mui/icons-material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { AppBar, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { useColorMode } from '../contexts/ThemeModeContext';
import { t } from '../i18n';

interface TopBarProps {
    onRefresh?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onRefresh }) => {
    const { mode, toggleColorMode } = useColorMode();

    return (
        <AppBar position="static" color="default" elevation={0}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>DobackSoft</Typography>
                <div>
                    {onRefresh && (
                        <Tooltip title={t('actualizar_datos')}>
                            <IconButton onClick={onRefresh} size="small">
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                    <Tooltip title={mode === 'light' ? t('modo_oscuro') : t('modo_claro')}>
                        <IconButton onClick={toggleColorMode} size="small">
                            {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
                        </IconButton>
                    </Tooltip>
                </div>
            </Toolbar>
        </AppBar>
    );
};

export default TopBar; 