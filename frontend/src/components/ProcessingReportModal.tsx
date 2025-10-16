/**
 * 📊 MODAL DE REPORTE DE PROCESAMIENTO
 * 
 * Muestra un resumen visual detallado del procesamiento masivo
 * 
 * @version 1.0
 * @date 2025-10-11
 */

import {
    Assessment as AssessmentIcon,
    CheckCircle as CheckCircleIcon,
    CloudDone as CloudDoneIcon,
    Error as ErrorIcon,
    Info as InfoIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    LinearProgress,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Typography
} from '@mui/material';
import React from 'react';

interface ProcessingReportModalProps {
    open: boolean;
    onClose: () => void;
    results: {
        totalFiles?: number;
        totalSaved?: number;
        totalSkipped?: number;
        results?: Array<{
            vehicle: string;
            date: string;
            savedSessions?: number;
            skippedSessions?: number;
            error?: string;
        }>;
        processingTime?: number;
        errors?: string[];
        warnings?: string[];
    } | null;
}

export const ProcessingReportModal: React.FC<ProcessingReportModalProps> = ({
    open,
    onClose,
    results
}) => {
    if (!results) return null;

    const totalSessions = (results.totalSaved || 0) + (results.totalSkipped || 0);
    const successRate = totalSessions > 0
        ? ((results.totalSaved || 0) / totalSessions) * 100
        : 0;

    // Calcular estadísticas por vehículo
    const vehicleStats = results.results?.reduce((acc, r) => {
        if (!acc[r.vehicle]) {
            acc[r.vehicle] = {
                totalSaved: 0,
                totalSkipped: 0,
                totalFiles: 0,
                hasErrors: false
            };
        }
        acc[r.vehicle].totalSaved += r.savedSessions || 0;
        acc[r.vehicle].totalSkipped += r.skippedSessions || 0;
        acc[r.vehicle].totalFiles += 1;
        if (r.error) acc[r.vehicle].hasErrors = true;
        return acc;
    }, {} as Record<string, any>) || {};

    const uniqueVehicles = Object.keys(vehicleStats).length;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AssessmentIcon color="primary" fontSize="large" />
                    <div>
                        <Typography variant="h5">
                            📊 Reporte de Procesamiento Completo
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {new Date().toLocaleString('es-ES')}
                        </Typography>
                    </div>
                </Box>
            </DialogTitle>

            <DialogContent>
                {/* Resumen General */}
                <Card sx={{ mb: 3, bgcolor: 'success.50', border: '2px solid', borderColor: 'success.main' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <CloudDoneIcon sx={{ fontSize: 40, color: 'success.main' }} />
                            <div>
                                <Typography variant="h5" color="success.main" fontWeight="bold">
                                    ✅ Procesamiento Completado
                                </Typography>
                                <Typography variant="body2">
                                    {results.processingTime ? `Tiempo: ${(results.processingTime / 1000).toFixed(1)}s` : ''}
                                </Typography>
                            </div>
                        </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'white' }}>
                                    <Typography variant="h3" color="primary.main" fontWeight="bold">
                                        {uniqueVehicles}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Vehículos Procesados
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'white' }}>
                                    <Typography variant="h3" color="success.main" fontWeight="bold">
                                        {results.totalSaved || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Sesiones Creadas
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'white' }}>
                                    <Typography variant="h3" color="warning.main" fontWeight="bold">
                                        {results.totalSkipped || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Sesiones Omitidas
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* Tasa de Éxito */}
                        <Box sx={{ mt: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                    Tasa de Éxito
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                    {successRate.toFixed(1)}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={successRate}
                                sx={{
                                    height: 12,
                                    borderRadius: 6,
                                    bgcolor: 'grey.200',
                                    '& .MuiLinearProgress-bar': {
                                        bgcolor: successRate > 80 ? 'success.main' : successRate > 50 ? 'warning.main' : 'error.main',
                                        borderRadius: 6
                                    }
                                }}
                            />
                        </Box>
                    </CardContent>
                </Card>

                {/* Detalle por Vehículo */}
                <Typography variant="h6" gutterBottom sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InfoIcon color="primary" />
                    Detalle por Vehículo
                </Typography>

                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {Object.entries(vehicleStats).map(([vehicle, stats]) => (
                        <Card key={vehicle} sx={{ mb: 2 }} variant="outlined">
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="subtitle1" fontWeight="bold">
                                        🚗 {vehicle}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Chip
                                            label={`${stats.totalSaved} creadas`}
                                            color="success"
                                            size="small"
                                        />
                                        {stats.totalSkipped > 0 && (
                                            <Chip
                                                label={`${stats.totalSkipped} omitidas`}
                                                color="warning"
                                                size="small"
                                            />
                                        )}
                                        {stats.hasErrors && (
                                            <Chip
                                                icon={<ErrorIcon />}
                                                label="Con errores"
                                                color="error"
                                                size="small"
                                            />
                                        )}
                                    </Box>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {stats.totalFiles} archivo(s) procesado(s)
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Box>

                {/* Advertencias */}
                {results.warnings && results.warnings.length > 0 && (
                    <Alert severity="warning" sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            ⚠️ Advertencias Detectadas ({results.warnings.length})
                        </Typography>
                        <List dense>
                            {results.warnings.slice(0, 5).map((warning, idx) => (
                                <ListItem key={idx} sx={{ py: 0.5 }}>
                                    <ListItemIcon sx={{ minWidth: 30 }}>
                                        <WarningIcon fontSize="small" color="warning" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={warning}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                </ListItem>
                            ))}
                            {results.warnings.length > 5 && (
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 5 }}>
                                    ... y {results.warnings.length - 5} advertencias más
                                </Typography>
                            )}
                        </List>
                    </Alert>
                )}

                {/* Errores */}
                {results.errors && results.errors.length > 0 && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            ❌ Errores Encontrados ({results.errors.length})
                        </Typography>
                        <List dense>
                            {results.errors.slice(0, 5).map((error, idx) => (
                                <ListItem key={idx} sx={{ py: 0.5 }}>
                                    <ListItemIcon sx={{ minWidth: 30 }}>
                                        <ErrorIcon fontSize="small" color="error" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={error}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                </ListItem>
                            ))}
                            {results.errors.length > 5 && (
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 5 }}>
                                    ... y {results.errors.length - 5} errores más
                                </Typography>
                            )}
                        </List>
                    </Alert>
                )}

                {/* Resumen de Calidad de Datos */}
                {(results.totalSaved || 0) > 0 && (
                    <Card sx={{ mt: 3, bgcolor: 'info.50' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                📈 Resumen de Calidad de Datos
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Sesiones Procesadas
                                    </Typography>
                                    <Typography variant="h6">
                                        {totalSessions}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Tasa de Éxito
                                    </Typography>
                                    <Typography variant="h6" color={successRate > 80 ? 'success.main' : successRate > 50 ? 'warning.main' : 'error.main'}>
                                        {successRate.toFixed(1)}%
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 2 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    💡 Información Importante:
                                </Typography>
                                <List dense>
                                    <ListItem sx={{ py: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 30 }}>
                                            <CheckCircleIcon fontSize="small" color="success" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="GPS inválidos fueron rechazados automáticamente"
                                            primaryTypographyProps={{ variant: 'caption' }}
                                        />
                                    </ListItem>
                                    <ListItem sx={{ py: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 30 }}>
                                            <CheckCircleIcon fontSize="small" color="success" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Saltos GPS > 1km fueron detectados y reportados"
                                            primaryTypographyProps={{ variant: 'caption' }}
                                        />
                                    </ListItem>
                                    <ListItem sx={{ py: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 30 }}>
                                            <InfoIcon fontSize="small" color="info" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary="Sesiones ya existentes fueron omitidas (duplicados)"
                                            primaryTypographyProps={{ variant: 'caption' }}
                                        />
                                    </ListItem>
                                </List>
                            </Box>
                        </CardContent>
                    </Card>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="contained" color="primary">
                    Entendido
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProcessingReportModal;

