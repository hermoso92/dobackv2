import {
    CloudDownload,
    FileDownload,
    GetApp
} from '@mui/icons-material';
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Grid,
    LinearProgress,
    MenuItem,
    Select,
    TextField,
    Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { ExportOptions, useExport } from '../../hooks/useExport';
import { logger } from '../../utils/logger';

interface ExportDialogProps {
    open: boolean;
    onClose: () => void;
    exportType: 'telemetry' | 'session' | 'events';
    sessionId?: string;
    vehicleIds?: string[];
    defaultDateRange?: {
        start: Date;
        end: Date;
    };
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
    open,
    onClose,
    exportType,
    sessionId,
    vehicleIds = [],
    defaultDateRange
}) => {
    const { isExporting, error, exportTelemetry, exportSession, exportEvents, clearError } = useExport();

    // Estados del formulario
    const [format, setFormat] = useState<'CSV' | 'PDF'>('CSV');
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: defaultDateRange?.start || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: defaultDateRange?.end || new Date()
    });

    // Opciones de inclusión
    const [includeGPS, setIncludeGPS] = useState(true);
    const [includeCAN, setIncludeCAN] = useState(true);
    const [includeStability, setIncludeStability] = useState(true);
    const [includeRotativo, setIncludeRotativo] = useState(true);
    const [includeEvents, setIncludeEvents] = useState(true);
    const [includeCharts, setIncludeCharts] = useState(true);
    const [includeMaps, setIncludeMaps] = useState(true);
    const [includeRecommendations, setIncludeRecommendations] = useState(false);

    // Resetear formulario cuando se abre el diálogo
    useEffect(() => {
        if (open) {
            setDateRange({
                start: defaultDateRange?.start || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                end: defaultDateRange?.end || new Date()
            });
            clearError();
        }
    }, [open, defaultDateRange, clearError]);

    const handleExport = useCallback(async () => {
        try {
            const options: ExportOptions = {
                format,
                includeGPS,
                includeCAN,
                includeStability,
                includeRotativo,
                includeEvents,
                includeCharts,
                includeMaps,
                includeRecommendations,
                dateRange,
                vehicleIds
            };

            logger.info('Iniciando exportación desde diálogo', { exportType, options });

            switch (exportType) {
                case 'telemetry':
                    await exportTelemetry(options);
                    break;
                case 'session':
                    if (sessionId) {
                        await exportSession(sessionId, options);
                    }
                    break;
                case 'events':
                    await exportEvents(options);
                    break;
                default:
                    throw new Error(`Tipo de exportación no soportado: ${exportType}`);
            }

            // Cerrar diálogo después de exportación exitosa
            onClose();

        } catch (err) {
            logger.error('Error en exportación desde diálogo', { error: err, exportType });
        }
    }, [
        format,
        includeGPS,
        includeCAN,
        includeStability,
        includeRotativo,
        includeEvents,
        includeCharts,
        includeMaps,
        includeRecommendations,
        dateRange,
        vehicleIds,
        exportType,
        sessionId,
        exportTelemetry,
        exportSession,
        exportEvents,
        onClose
    ]);

    const getTitle = () => {
        switch (exportType) {
            case 'telemetry':
                return 'Exportar Datos de Telemetría';
            case 'session':
                return 'Exportar Sesión';
            case 'events':
                return 'Exportar Eventos';
            default:
                return 'Exportar Datos';
        }
    };

    const getDescription = () => {
        switch (exportType) {
            case 'telemetry':
                return 'Exporta todos los datos de telemetría en el rango de fechas seleccionado';
            case 'session':
                return `Exporta los datos completos de la sesión ${sessionId}`;
            case 'events':
                return 'Exporta todos los eventos de estabilidad en el rango de fechas seleccionado';
            default:
                return '';
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '500px' }
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CloudDownload color="primary" />
                    <Typography variant="h6">{getTitle()}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {getDescription()}
                </Typography>
            </DialogTitle>

            <DialogContent>
                {isExporting && (
                    <Box sx={{ mb: 2 }}>
                        <LinearProgress />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            Generando archivo {format}...
                        </Typography>
                    </Box>
                )}

                {error && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                        <Typography variant="body2" color="error">
                            {error}
                        </Typography>
                    </Box>
                )}

                <Grid container spacing={3}>
                    {/* Formato */}
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <FormLabel>Formato de Exportación</FormLabel>
                            <Select
                                value={format}
                                onChange={(e) => setFormat(e.target.value as 'CSV' | 'PDF')}
                                disabled={isExporting}
                            >
                                <MenuItem value="CSV">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <FileDownload fontSize="small" />
                                        CSV (Datos tabulares)
                                    </Box>
                                </MenuItem>
                                <MenuItem value="PDF">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <GetApp fontSize="small" />
                                        PDF (Reporte completo)
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Rango de fechas (solo para telemetría y eventos) */}
                    {(exportType === 'telemetry' || exportType === 'events') && (
                        <>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Fecha Inicio"
                                    type="date"
                                    value={dateRange.start.toISOString().split('T')[0]}
                                    onChange={(e) => setDateRange(prev => ({
                                        ...prev,
                                        start: new Date(e.target.value)
                                    }))}
                                    disabled={isExporting}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField
                                    fullWidth
                                    label="Fecha Fin"
                                    type="date"
                                    value={dateRange.end.toISOString().split('T')[0]}
                                    onChange={(e) => setDateRange(prev => ({
                                        ...prev,
                                        end: new Date(e.target.value)
                                    }))}
                                    disabled={isExporting}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </>
                    )}

                    {/* Opciones de inclusión */}
                    <Grid item xs={12}>
                        <FormControl component="fieldset">
                            <FormLabel component="legend">
                                {format === 'CSV' ? 'Incluir Datos' : 'Incluir en Reporte'}
                            </FormLabel>
                            <FormGroup>
                                <Grid container>
                                    <Grid item xs={12} md={6}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={includeGPS}
                                                    onChange={(e) => setIncludeGPS(e.target.checked)}
                                                    disabled={isExporting}
                                                />
                                            }
                                            label="Datos GPS"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={includeCAN}
                                                    onChange={(e) => setIncludeCAN(e.target.checked)}
                                                    disabled={isExporting}
                                                />
                                            }
                                            label="Datos CAN"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={includeStability}
                                                    onChange={(e) => setIncludeStability(e.target.checked)}
                                                    disabled={isExporting}
                                                />
                                            }
                                            label="Datos Estabilidad"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={includeRotativo}
                                                    onChange={(e) => setIncludeRotativo(e.target.checked)}
                                                    disabled={isExporting}
                                                />
                                            }
                                            label="Datos Rotativo"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={includeEvents}
                                                    onChange={(e) => setIncludeEvents(e.target.checked)}
                                                    disabled={isExporting}
                                                />
                                            }
                                            label="Eventos"
                                        />
                                        {format === 'PDF' && (
                                            <>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={includeCharts}
                                                            onChange={(e) => setIncludeCharts(e.target.checked)}
                                                            disabled={isExporting}
                                                        />
                                                    }
                                                    label="Gráficos"
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={includeMaps}
                                                            onChange={(e) => setIncludeMaps(e.target.checked)}
                                                            disabled={isExporting}
                                                        />
                                                    }
                                                    label="Mapas"
                                                />
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={includeRecommendations}
                                                            onChange={(e) => setIncludeRecommendations(e.target.checked)}
                                                            disabled={isExporting}
                                                        />
                                                    }
                                                    label="Recomendaciones IA"
                                                />
                                            </>
                                        )}
                                    </Grid>
                                </Grid>
                            </FormGroup>
                        </FormControl>
                    </Grid>

                    {/* Información adicional */}
                    <Grid item xs={12}>
                        <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                            <Typography variant="body2" color="info.dark">
                                <strong>Información:</strong>
                                {format === 'CSV'
                                    ? ' El archivo CSV incluirá todas las mediciones seleccionadas en formato tabular para análisis en Excel o herramientas similares.'
                                    : ' El archivo PDF incluirá un reporte completo con gráficos, mapas y análisis visual de los datos.'
                                }
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
                <Button
                    onClick={onClose}
                    disabled={isExporting}
                    variant="outlined"
                >
                    Cancelar
                </Button>
                <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    variant="contained"
                    startIcon={isExporting ? undefined : <CloudDownload />}
                    sx={{ minWidth: 140 }}
                >
                    {isExporting ? 'Exportando...' : 'Exportar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
