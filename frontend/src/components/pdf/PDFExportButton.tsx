import {
    Assessment,
    Map,
    PictureAsPdf,
    Speed,
    TableChart,
    TrendingUp,
    Warning
} from '@mui/icons-material';
import {
    Button,
    CircularProgress,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Tooltip
} from '@mui/material';
import React from 'react';
import { usePDFExport, UsePDFExportOptions } from '../../hooks/usePDFExport';
import { PDFExportOptions } from '../../services/pdfExport';

export interface PDFExportButtonProps {
    // Tipo de exportación
    exportType: 'dashboard' | 'telemetry' | 'stability' | 'speed' | 'events' | 'kpis';

    // Datos específicos según el tipo
    sessionId?: string;
    events?: any[];

    // Opciones de exportación
    exportOptions?: PDFExportOptions;
    hookOptions?: UsePDFExportOptions;

    // Props del botón
    variant?: 'text' | 'outlined' | 'contained';
    size?: 'small' | 'medium' | 'large';
    color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    disabled?: boolean;

    // Opciones de visualización
    showLabel?: boolean;
    showIcon?: boolean;
    showMenu?: boolean;
    label?: string;

    // Callbacks
    onExportStart?: () => void;
    onExportComplete?: (fileName: string) => void;
    onExportError?: (error: string) => void;
}

export const PDFExportButton: React.FC<PDFExportButtonProps> = ({
    exportType,
    sessionId,
    events = [],
    exportOptions = {},
    hookOptions = {},
    variant = 'contained',
    size = 'medium',
    color = 'primary',
    disabled = false,
    showLabel = true,
    showIcon = true,
    showMenu = false,
    label,
    onExportStart,
    onExportComplete,
    onExportError
}) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const {
        isExporting,
        error,
        exportDashboard,
        exportTelemetry,
        exportStability,
        exportSpeedAnalysis,
        exportEvents,
        exportKPIs
    } = usePDFExport({
        ...hookOptions,
        onSuccess: (fileName: string) => {
            hookOptions.onSuccess?.(fileName);
            onExportComplete?.(fileName);
        },
        onError: (error: string) => {
            hookOptions.onError?.(error);
            onExportError?.(error);
        }
    });

    const handleExport = async () => {
        onExportStart?.();

        try {
            switch (exportType) {
                case 'dashboard':
                    await exportDashboard(exportOptions);
                    break;
                case 'telemetry':
                    if (!sessionId) throw new Error('SessionId requerido para exportar telemetría');
                    await exportTelemetry(sessionId, exportOptions);
                    break;
                case 'stability':
                    if (!sessionId) throw new Error('SessionId requerido para exportar estabilidad');
                    await exportStability(sessionId, exportOptions);
                    break;
                case 'speed':
                    await exportSpeedAnalysis(events, exportOptions);
                    break;
                case 'events':
                    await exportEvents(events, exportOptions);
                    break;
                case 'kpis':
                    await exportKPIs(exportOptions);
                    break;
                default:
                    throw new Error(`Tipo de exportación no soportado: ${exportType}`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error en la exportación';
            onExportError?.(errorMessage);
        }
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMenuExport = async (type: PDFExportButtonProps['exportType']) => {
        handleMenuClose();

        // Actualizar el tipo de exportación y ejecutar
        const originalType = exportType;
        (exportType as any) = type;

        await handleExport();

        // Restaurar tipo original
        (exportType as any) = originalType;
    };

    const getIcon = () => {
        if (isExporting) return <CircularProgress size={20} />;

        switch (exportType) {
            case 'dashboard': return <Assessment />;
            case 'telemetry': return <Map />;
            case 'stability': return <TrendingUp />;
            case 'speed': return <Speed />;
            case 'events': return <Warning />;
            case 'kpis': return <TableChart />;
            default: return <PictureAsPdf />;
        }
    };

    const getLabel = () => {
        if (label) return label;

        switch (exportType) {
            case 'dashboard': return 'Exportar Dashboard';
            case 'telemetry': return 'Exportar Telemetría';
            case 'stability': return 'Exportar Estabilidad';
            case 'speed': return 'Exportar Análisis de Velocidad';
            case 'events': return 'Exportar Eventos';
            case 'kpis': return 'Exportar KPIs';
            default: return 'Exportar PDF';
        }
    };

    const getTooltip = () => {
        if (isExporting) return 'Generando PDF...';
        if (error) return `Error: ${error}`;
        return `Descargar ${getLabel().toLowerCase()}`;
    };

    if (showMenu) {
        return (
            <>
                <Button
                    variant={variant}
                    size={size}
                    color={color}
                    disabled={disabled || isExporting}
                    onClick={handleMenuClick}
                    startIcon={showIcon ? getIcon() : undefined}
                >
                    {showLabel ? getLabel() : ''}
                </Button>

                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                >
                    <MenuItem onClick={() => handleMenuExport('dashboard')}>
                        <ListItemIcon><Assessment fontSize="small" /></ListItemIcon>
                        <ListItemText>Dashboard Ejecutivo</ListItemText>
                    </MenuItem>

                    <MenuItem onClick={() => handleMenuExport('telemetry')} disabled={!sessionId}>
                        <ListItemIcon><Map fontSize="small" /></ListItemIcon>
                        <ListItemText>Telemetría</ListItemText>
                    </MenuItem>

                    <MenuItem onClick={() => handleMenuExport('stability')} disabled={!sessionId}>
                        <ListItemIcon><TrendingUp fontSize="small" /></ListItemIcon>
                        <ListItemText>Estabilidad</ListItemText>
                    </MenuItem>

                    <MenuItem onClick={() => handleMenuExport('speed')} disabled={events.length === 0}>
                        <ListItemIcon><Speed fontSize="small" /></ListItemIcon>
                        <ListItemText>Análisis de Velocidad</ListItemText>
                    </MenuItem>

                    <MenuItem onClick={() => handleMenuExport('events')} disabled={events.length === 0}>
                        <ListItemIcon><Warning fontSize="small" /></ListItemIcon>
                        <ListItemText>Eventos</ListItemText>
                    </MenuItem>

                    <MenuItem onClick={() => handleMenuExport('kpis')}>
                        <ListItemIcon><TableChart fontSize="small" /></ListItemIcon>
                        <ListItemText>KPIs Avanzados</ListItemText>
                    </MenuItem>
                </Menu>
            </>
        );
    }

    return (
        <Tooltip title={getTooltip()}>
            <span>
                <Button
                    variant={variant}
                    size={size}
                    color={color}
                    disabled={disabled || isExporting}
                    onClick={handleExport}
                    startIcon={showIcon ? getIcon() : undefined}
                >
                    {showLabel ? getLabel() : ''}
                </Button>
            </span>
        </Tooltip>
    );
};

// Componente simplificado para iconos solamente
export const PDFExportIconButton: React.FC<Omit<PDFExportButtonProps, 'showLabel' | 'showMenu'>> = (props) => {
    return (
        <PDFExportButton
            {...props}
            showLabel={false}
            variant="text"
        />
    );
};

// Componente para botón de descarga simple
export const SimplePDFExportButton: React.FC<Omit<PDFExportButtonProps, 'showMenu'>> = (props) => {
    return (
        <PDFExportButton
            {...props}
            showMenu={false}
        />
    );
};
