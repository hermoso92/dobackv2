import {
    Analytics as AnalyticsIcon,
    Dashboard as DashboardIcon,
    Speed as SpeedIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';
import {
    Box,
    Button,
    ButtonGroup,
    Paper,
    Tooltip,
    useTheme
} from '@mui/material';
import React from 'react';

interface DashboardNavigationProps {
    activeView: 'general' | 'analysis' | 'events' | 'timeline';
    onViewChange: (view: 'general' | 'analysis' | 'events' | 'timeline') => void;
    eventCount?: number;
}

export const DashboardNavigation: React.FC<DashboardNavigationProps> = ({
    activeView,
    onViewChange,
    eventCount = 0
}) => {
    const theme = useTheme();

    const navigationItems = [
        {
            key: 'general' as const,
            label: 'General',
            icon: <DashboardIcon />,
            tooltip: 'Vista general del dashboard'
        },
        {
            key: 'analysis' as const,
            label: 'Análisis',
            icon: <AnalyticsIcon />,
            tooltip: 'Análisis inteligente y recomendaciones'
        },
        {
            key: 'events' as const,
            label: `Eventos (${eventCount})`,
            icon: <SpeedIcon />,
            tooltip: 'Lista detallada de eventos'
        },
        {
            key: 'timeline' as const,
            label: 'Timeline',
            icon: <TimelineIcon />,
            tooltip: 'Vista cronológica de eventos'
        }
    ];

    return (
        <Paper
            elevation={2}
            sx={{
                p: 2,
                mb: 3,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                borderRadius: 2
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <ButtonGroup
                    variant="contained"
                    size="large"
                    sx={{
                        '& .MuiButton-root': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            minWidth: 120,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                            },
                            '&.active': {
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                color: theme.palette.primary.main,
                                fontWeight: 'bold',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)'
                            }
                        }
                    }}
                >
                    {navigationItems.map((item) => (
                        <Tooltip key={item.key} title={item.tooltip} arrow>
                            <Button
                                className={activeView === item.key ? 'active' : ''}
                                onClick={() => onViewChange(item.key)}
                                startIcon={item.icon}
                            >
                                {item.label}
                            </Button>
                        </Tooltip>
                    ))}
                </ButtonGroup>
            </Box>
        </Paper>
    );
};

export default DashboardNavigation; 