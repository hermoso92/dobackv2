import { createTheme } from '@mui/material/styles';

// Tema personalizado para Bomberos Madrid
export const bomberosMadridTheme = createTheme({
    palette: {
        primary: {
            main: '#D32F2F', // Rojo bomberos
            light: '#FF6659',
            dark: '#9A0007',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#FFA000', // Naranja emergencia
            light: '#FFD149',
            dark: '#C67100',
            contrastText: '#000000',
        },
        error: {
            main: '#F44336',
            light: '#E57373',
            dark: '#D32F2F',
        },
        warning: {
            main: '#FF9800',
            light: '#FFB74D',
            dark: '#F57C00',
        },
        success: {
            main: '#4CAF50',
            light: '#81C784',
            dark: '#388E3C',
        },
        info: {
            main: '#2196F3',
            light: '#64B5F6',
            dark: '#1976D2',
        },
        background: {
            default: '#FAFAFA',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#212121',
            secondary: '#757575',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontSize: '2.5rem',
            fontWeight: 600,
            color: '#D32F2F',
        },
        h2: {
            fontSize: '2rem',
            fontWeight: 600,
            color: '#D32F2F',
        },
        h3: {
            fontSize: '1.75rem',
            fontWeight: 500,
            color: '#D32F2F',
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 500,
            color: '#D32F2F',
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 500,
            color: '#D32F2F',
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 500,
            color: '#D32F2F',
        },
        body1: {
            fontSize: '1rem',
            lineHeight: 1.5,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.43,
        },
        button: {
            textTransform: 'none',
            fontWeight: 500,
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 500,
                    padding: '8px 16px',
                },
                contained: {
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    '&:hover': {
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#D32F2F',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#F5F5F5',
                    borderRight: '1px solid #E0E0E0',
                },
            },
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    margin: '4px 8px',
                    '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.08)',
                    },
                    '&.Mui-selected': {
                        backgroundColor: 'rgba(211, 47, 47, 0.12)',
                        '&:hover': {
                            backgroundColor: 'rgba(211, 47, 47, 0.16)',
                        },
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 16,
                },
                colorPrimary: {
                    backgroundColor: '#D32F2F',
                    color: '#FFFFFF',
                },
                colorSecondary: {
                    backgroundColor: '#FFA000',
                    color: '#000000',
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                },
                standardError: {
                    backgroundColor: '#FFEBEE',
                    color: '#C62828',
                },
                standardWarning: {
                    backgroundColor: '#FFF3E0',
                    color: '#E65100',
                },
                standardInfo: {
                    backgroundColor: '#E3F2FD',
                    color: '#1565C0',
                },
                standardSuccess: {
                    backgroundColor: '#E8F5E8',
                    color: '#2E7D32',
                },
            },
        },
        MuiTableHead: {
            styleOverrides: {
                root: {
                    backgroundColor: '#F5F5F5',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    fontWeight: 600,
                    color: '#D32F2F',
                },
            },
        },
    },
});

// Colores específicos para estados de emergencia
export const emergencyColors = {
    fire: '#D32F2F',      // Rojo - Incendio
    medical: '#FF9800',    // Naranja - Médico
    rescue: '#2196F3',     // Azul - Rescate
    hazmat: '#9C27B0',     // Morado - Materiales peligrosos
    routine: '#4CAF50',    // Verde - Rutina
    maintenance: '#607D8B', // Gris - Mantenimiento
};

// Colores para severidad
export const severityColors = {
    LOW: '#4CAF50',        // Verde
    MEDIUM: '#FF9800',     // Naranja
    HIGH: '#FF5722',       // Rojo naranja
    CRITICAL: '#D32F2F',   // Rojo
};

// Colores para estados de vehículos
export const vehicleStatusColors = {
    ACTIVE: '#4CAF50',     // Verde
    INACTIVE: '#9E9E9E',   // Gris
    MAINTENANCE: '#FF9800', // Naranja
    EMERGENCY: '#D32F2F',  // Rojo
};

export default bomberosMadridTheme;
