/**
 * 📊 REPORTE DETALLADO DE PROCESAMIENTO
 * 
 * Muestra información exhaustiva de cada archivo y sesión procesada
 * 
 * @version 2.0
 * @date 2025-10-11
 */

import {
    Assessment as AssessmentIcon,
    Cancel as CancelIcon,
    CheckCircle as CheckCircleIcon,
    CloudDone as CloudDoneIcon,
    ExpandMore as ExpandMoreIcon,
    Description as FileIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
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
    ListItemText,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import React, { useState } from 'react';

interface SessionDetail {
    sessionNumber: number;
    sessionId: string;
    startTime: string;
    endTime: string;
    measurements: number;
    status: string;
    reason: string;
    archivos?: { // ✅ NUEVO
        estabilidad: string | null;
        gps: string | null;
        rotativo: string | null;
    };
    dataQuality?: {
        totalMeasurements: number;
        validMeasurements: number;
    };
    // ✅ NUEVO: Información de eventos y procesamiento
    eventsGenerated?: number;
    segmentsGenerated?: number;
    events?: Array<{
        type: string;
        severity: string;
        timestamp: Date;
        lat?: number;
        lon?: number;
    }>;
    geofenceEvents?: number;
    routeDistance?: number;
    routeConfidence?: number;
    speedViolations?: number;
    gpsPoints?: number;
    stabilityMeasurements?: number;
}

interface FileDetail {
    fileName: string;
    fileType: string;
    fileSize: number;
    totalLines: number;
    sessionsDetected: number;
    sessionsCreated: number;
    sessionsSkipped: number;
    sessionDetails: SessionDetail[];
    measurements: number;
    errors: string[];
    warnings: string[];
}

interface VehicleResult {
    vehicle: string;
    savedSessions: number;
    skippedSessions: number;
    filesProcessed: number;
    files: FileDetail[];
    sessionDetails?: SessionDetail[]; // ✅ NUEVO
    errors: string[];
}

interface DetailedProcessingReportProps {
    open: boolean;
    onClose: () => void;
    results: {
        totalFiles?: number;
        totalSaved?: number;
        totalSkipped?: number;
        results?: VehicleResult[];
        processingTime?: number;
        errors?: any[];
        warnings?: string[];
    } | null;
}

export const DetailedProcessingReport: React.FC<DetailedProcessingReportProps> = ({
    open,
    onClose,
    results
}) => {
    const [expandedVehicle, setExpandedVehicle] = useState<string | false>(false);
    const [expandedFile, setExpandedFile] = useState<string | false>(false);

    if (!results) return null;

    const totalSessions = (results.totalSaved || 0) + (results.totalSkipped || 0);
    const successRate = totalSessions > 0
        ? ((results.totalSaved || 0) / totalSessions) * 100
        : 0;

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (isoDate: string) => {
        return new Date(isoDate).toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { height: '90vh' }
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AssessmentIcon color="primary" sx={{ fontSize: 40 }} />
                    <div>
                        <Typography variant="h5">
                            📊 Reporte Detallado de Procesamiento
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Información exhaustiva de cada archivo y sesión
                        </Typography>
                    </div>
                </Box>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3 }}>
                {/* Resumen General */}
                <Card sx={{ mb: 3, bgcolor: 'success.50', border: '2px solid', borderColor: 'success.main' }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <CloudDoneIcon sx={{ fontSize: 48, color: 'success.main' }} />
                            <div>
                                <Typography variant="h5" color="success.main" fontWeight="bold">
                                    ✅ Procesamiento Completado
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {new Date().toLocaleString('es-ES')}
                                </Typography>
                            </div>
                        </Box>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={3}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'white' }}>
                                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                                        {results.results?.length || 0}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Vehículos Procesados
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'white' }}>
                                    <Typography variant="h4" color="success.main" fontWeight="bold">
                                        {results.totalSaved || 0}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Sesiones Creadas
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'white' }}>
                                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                                        {results.totalSkipped || 0}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Sesiones Omitidas
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={3}>
                                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'white' }}>
                                    <Typography variant="h4" color="info.main" fontWeight="bold">
                                        {results.totalFiles || 0}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Archivos Procesados
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* Barra de Éxito */}
                        <Box sx={{ mt: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                    Tasa de Éxito General
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
                <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
                    📋 Detalle Exhaustivo por Vehículo
                </Typography>

                {results.results?.map((vehicleData) => (
                    <Accordion
                        key={vehicleData.vehicle}
                        expanded={expandedVehicle === vehicleData.vehicle}
                        onChange={() => setExpandedVehicle(
                            expandedVehicle === vehicleData.vehicle ? false : vehicleData.vehicle
                        )}
                        sx={{ mb: 2 }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                <Typography variant="h6">
                                    🚗 {vehicleData.vehicle}
                                </Typography>
                                <Box sx={{ flexGrow: 1 }} />
                                <Chip
                                    label={`${vehicleData.savedSessions} creadas`}
                                    color="success"
                                    size="small"
                                />
                                {vehicleData.skippedSessions > 0 && (
                                    <Chip
                                        label={`${vehicleData.skippedSessions} omitidas`}
                                        color="warning"
                                        size="small"
                                    />
                                )}
                                <Chip
                                    label={`${vehicleData.filesProcessed} archivos`}
                                    variant="outlined"
                                    size="small"
                                />
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            {/* ✅ NUEVO: Detalle por Sesión con Archivos */}
                            {vehicleData.sessionDetails && vehicleData.sessionDetails.length > 0 ? (
                                <>
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 2, mb: 3 }}>
                                        🎯 Sesiones Creadas con Archivos Fuente
                                    </Typography>

                                    {vehicleData.sessionDetails.map((session: any) => (
                                        <Card key={session.sessionId} sx={{ mb: 2, bgcolor: session.status === 'CREADA' ? 'success.50' : 'grey.100' }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                    {session.status === 'CREADA' ? (
                                                        <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
                                                    ) : (
                                                        <InfoIcon color="info" sx={{ fontSize: 32 }} />
                                                    )}
                                                    <div>
                                                        <Typography variant="h6" fontWeight="bold">
                                                            Sesión {session.sessionNumber}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {formatDate(session.startTime)} → {formatDate(session.endTime)}
                                                        </Typography>
                                                    </div>
                                                    <Box sx={{ flexGrow: 1 }} />
                                                    <Chip
                                                        label={session.status}
                                                        color={session.status === 'CREADA' ? 'success' : 'default'}
                                                        size="small"
                                                    />
                                                    <Chip
                                                        label={`${session.measurements} mediciones`}
                                                        variant="outlined"
                                                        size="small"
                                                    />
                                                </Box>

                                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                                    📄 Archivos Utilizados:
                                                </Typography>

                                                <List dense>
                                                    {session.archivos.estabilidad && (
                                                        <ListItem>
                                                            <FileIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                                                            <ListItemText
                                                                primary={`ESTABILIDAD: ${session.archivos.estabilidad}`}
                                                                primaryTypographyProps={{ variant: 'body2' }}
                                                            />
                                                        </ListItem>
                                                    )}
                                                    {session.archivos.gps ? (
                                                        <ListItem>
                                                            <FileIcon sx={{ mr: 1, color: 'success.main' }} fontSize="small" />
                                                            <ListItemText
                                                                primary={`GPS: ${session.archivos.gps}`}
                                                                primaryTypographyProps={{ variant: 'body2' }}
                                                            />
                                                        </ListItem>
                                                    ) : (
                                                        <ListItem>
                                                            <CancelIcon sx={{ mr: 1, color: 'warning.main' }} fontSize="small" />
                                                            <ListItemText
                                                                primary="GPS: [sin datos]"
                                                                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                                            />
                                                        </ListItem>
                                                    )}
                                                    {session.archivos.rotativo && (
                                                        <ListItem>
                                                            <FileIcon sx={{ mr: 1, color: 'info.main' }} fontSize="small" />
                                                            <ListItemText
                                                                primary={`ROTATIVO: ${session.archivos.rotativo}`}
                                                                primaryTypographyProps={{ variant: 'body2' }}
                                                            />
                                                        </ListItem>
                                                    )}
                                                </List>

                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                                    {session.reason}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </>
                            ) : null}

                            {/* Detalle por Archivo (secundario) */}
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 4 }}>
                                📁 Archivos Procesados (Vista Técnica)
                            </Typography>

                            {vehicleData.files?.map((file) => (
                                <Accordion
                                    key={`${vehicleData.vehicle}-${file.fileName}`}
                                    expanded={expandedFile === `${vehicleData.vehicle}-${file.fileName}`}
                                    onChange={() => setExpandedFile(
                                        expandedFile === `${vehicleData.vehicle}-${file.fileName}`
                                            ? false
                                            : `${vehicleData.vehicle}-${file.fileName}`
                                    )}
                                    sx={{ mb: 1, ml: 2 }}
                                >
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                            <FileIcon color="primary" />
                                            <div>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    {file.fileName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {file.fileType} • {formatBytes(file.fileSize)} • {file.totalLines} líneas
                                                </Typography>
                                            </div>
                                            <Box sx={{ flexGrow: 1 }} />
                                            <Chip
                                                label={`${file.sessionsCreated}/${file.sessionsDetected} creadas`}
                                                color={file.sessionsCreated > 0 ? 'success' : 'default'}
                                                size="small"
                                            />
                                            {file.sessionsSkipped > 0 && (
                                                <Chip
                                                    label={`${file.sessionsSkipped} omitidas`}
                                                    color="warning"
                                                    size="small"
                                                />
                                            )}
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        {/* Información del Archivo */}
                                        <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6} sm={3}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Tipo
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {file.fileType}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Tamaño
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {formatBytes(file.fileSize)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Total Líneas
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {file.totalLines}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Mediciones
                                                    </Typography>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {file.measurements}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        {/* Tabla de Sesiones Detectadas */}
                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                            Sesiones Detectadas en Este Archivo:
                                        </Typography>

                                        {file.sessionDetails && file.sessionDetails.length > 0 ? (
                                            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell><strong>#</strong></TableCell>
                                                            <TableCell><strong>ID Sesión</strong></TableCell>
                                                            <TableCell><strong>Inicio</strong></TableCell>
                                                            <TableCell><strong>Fin</strong></TableCell>
                                                            <TableCell align="center"><strong>Mediciones</strong></TableCell>
                                                            <TableCell><strong>Estado</strong></TableCell>
                                                            <TableCell><strong>Razón</strong></TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {file.sessionDetails.map((session, idx) => (
                                                            <TableRow
                                                                key={idx}
                                                                sx={{
                                                                    bgcolor: session.status === 'CREADA'
                                                                        ? 'success.50'
                                                                        : 'warning.50'
                                                                }}
                                                            >
                                                                <TableCell>{session.sessionNumber}</TableCell>
                                                                <TableCell>
                                                                    <Typography variant="caption" fontFamily="monospace">
                                                                        {session.sessionId.substring(0, 8)}...
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="caption">
                                                                        {formatDate(session.startTime)}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="caption">
                                                                        {formatDate(session.endTime)}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    <Chip
                                                                        label={session.measurements}
                                                                        size="small"
                                                                        color="info"
                                                                    />
                                                                </TableCell>
                                                                <TableCell>
                                                                    {session.status === 'CREADA' ? (
                                                                        <Chip
                                                                            icon={<CheckCircleIcon />}
                                                                            label="CREADA"
                                                                            color="success"
                                                                            size="small"
                                                                        />
                                                                    ) : (
                                                                        <Chip
                                                                            icon={<CancelIcon />}
                                                                            label="OMITIDA"
                                                                            color="warning"
                                                                            size="small"
                                                                        />
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {session.reason}
                                                                    </Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>

                                            {/* ✅ NUEVO: Información detallada de eventos y procesamiento */}
                                        {file.sessionDetails.some(s => s.eventsGenerated || s.segmentsGenerated) && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                                    📊 Información de Procesamiento:
                                                </Typography>
                                                <Grid container spacing={2}>
                                                    {file.sessionDetails.map((session, idx) => (
                                                        <Grid item xs={12} key={idx}>
                                                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                                                                <Typography variant="caption" fontWeight="bold" color="primary">
                                                                    Sesión #{session.sessionNumber}
                                                                </Typography>
                                                                <Grid container spacing={1} sx={{ mt: 1 }}>
                                                                    {session.eventsGenerated !== undefined && (
                                                                        <Grid item xs={6} sm={3}>
                                                                            <Chip
                                                                                label={`🚨 ${session.eventsGenerated} Eventos`}
                                                                                size="small"
                                                                                color="error"
                                                                                variant="outlined"
                                                                            />
                                                                        </Grid>
                                                                    )}
                                                                    {session.segmentsGenerated !== undefined && (
                                                                        <Grid item xs={6} sm={3}>
                                                                            <Chip
                                                                                label={`🔑 ${session.segmentsGenerated} Segmentos`}
                                                                                size="small"
                                                                                color="primary"
                                                                                variant="outlined"
                                                                            />
                                                                        </Grid>
                                                                    )}
                                                                    {session.gpsPoints !== undefined && (
                                                                        <Grid item xs={6} sm={3}>
                                                                            <Chip
                                                                                label={`📍 ${session.gpsPoints} GPS`}
                                                                                size="small"
                                                                                color="info"
                                                                                variant="outlined"
                                                                            />
                                                                        </Grid>
                                                                    )}
                                                                    {session.stabilityMeasurements !== undefined && (
                                                                        <Grid item xs={6} sm={3}>
                                                                            <Chip
                                                                                label={`📊 ${session.stabilityMeasurements} Estabilidad`}
                                                                                size="small"
                                                                                color="warning"
                                                                                variant="outlined"
                                                                            />
                                                                        </Grid>
                                                                    )}
                                                                    {session.routeDistance !== undefined && session.routeDistance > 0 && (
                                                                        <Grid item xs={6} sm={3}>
                                                                            <Chip
                                                                                label={`🗺️ ${(session.routeDistance / 1000).toFixed(2)} km`}
                                                                                size="small"
                                                                                color="success"
                                                                                variant="outlined"
                                                                            />
                                                                        </Grid>
                                                                    )}
                                                                    {session.geofenceEvents !== undefined && session.geofenceEvents > 0 && (
                                                                        <Grid item xs={6} sm={3}>
                                                                            <Chip
                                                                                label={`⭕ ${session.geofenceEvents} Geocercas`}
                                                                                size="small"
                                                                                color="secondary"
                                                                                variant="outlined"
                                                                            />
                                                                        </Grid>
                                                                    )}
                                                                    {session.speedViolations !== undefined && session.speedViolations > 0 && (
                                                                        <Grid item xs={6} sm={3}>
                                                                            <Chip
                                                                                label={`⚡ ${session.speedViolations} Velocidad`}
                                                                                size="small"
                                                                                color="error"
                                                                                variant="outlined"
                                                                            />
                                                                        </Grid>
                                                                    )}
                                                                </Grid>

                                                                {/* Mostrar eventos si existen */}
                                                                {session.events && session.events.length > 0 && (
                                                                    <Box sx={{ mt: 2 }}>
                                                                        <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                                                            Eventos Detectados:
                                                                        </Typography>
                                                                        <List dense>
                                                                            {session.events.map((event, eventIdx) => (
                                                                                <ListItem key={eventIdx} sx={{ py: 0.5 }}>
                                                                                    <ListItemText
                                                                                        primary={
                                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                                <Chip
                                                                                                    label={event.type}
                                                                                                    size="small"
                                                                                                    color={
                                                                                                        event.severity === 'critical' ? 'error' :
                                                                                                            event.severity === 'moderate' ? 'warning' : 'info'
                                                                                                    }
                                                                                                />
                                                                                                <Typography variant="caption" color="text.secondary">
                                                                                                    {new Date(event.timestamp).toLocaleString('es-ES')}
                                                                                                </Typography>
                                                                                            </Box>
                                                                                        }
                                                                                    />
                                                                                </ListItem>
                                                                            ))}
                                                                        </List>
                                                                    </Box>
                                                                )}
                                                            </Paper>
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </Box>
                                        )}
                                        ) : (
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            No se detectaron sesiones en este archivo
                                        </Alert>
                                        )}

                                        {/* Errores del Archivo */}
                                        {file.errors && file.errors.length > 0 && (
                                            <Alert severity="error" sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    Errores:
                                                </Typography>
                                                <List dense>
                                                    {file.errors.map((error, idx) => (
                                                        <ListItem key={idx} sx={{ py: 0 }}>
                                                            <ListItemText
                                                                primary={error}
                                                                primaryTypographyProps={{ variant: 'caption' }}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Alert>
                                        )}

                                        {/* Advertencias del Archivo */}
                                        {file.warnings && file.warnings.length > 0 && (
                                            <Alert severity="warning" sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    Advertencias:
                                                </Typography>
                                                <List dense>
                                                    {file.warnings.map((warning, idx) => (
                                                        <ListItem key={idx} sx={{ py: 0 }}>
                                                            <ListItemText
                                                                primary={warning}
                                                                primaryTypographyProps={{ variant: 'caption' }}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Alert>
                                        )}
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </AccordionDetails>
                    </Accordion>
                ))}

                {/* Información General */}
                <Card sx={{ mt: 3, bgcolor: 'info.50' }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InfoIcon color="info" />
                            Información Importante
                        </Typography>
                        <List dense>
                            <ListItem>
                                <CheckCircleIcon color="success" sx={{ mr: 1 }} fontSize="small" />
                                <ListItemText
                                    primary="GPS inválidos fueron rechazados automáticamente"
                                    secondary="Coordenadas fuera de rango (-180 a 180, -90 a 90) bloqueadas"
                                    primaryTypographyProps={{ variant: 'body2' }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                />
                            </ListItem>
                            <ListItem>
                                <CheckCircleIcon color="success" sx={{ mr: 1 }} fontSize="small" />
                                <ListItemText
                                    primary="Saltos GPS > 1km fueron detectados y reportados"
                                    secondary="Cambios de posición sospechosos entre mediciones consecutivas"
                                    primaryTypographyProps={{ variant: 'body2' }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                />
                            </ListItem>
                            <ListItem>
                                <InfoIcon color="info" sx={{ mr: 1 }} fontSize="small" />
                                <ListItemText
                                    primary="Sesiones ya existentes fueron omitidas (duplicados)"
                                    secondary="Sesiones con mismo vehículo, fecha y número ya en BD"
                                    primaryTypographyProps={{ variant: 'body2' }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                />
                            </ListItem>
                        </List>
                    </CardContent>
                </Card>

                {/* Errores Globales */}
                {results.errors && results.errors.length > 0 && (
                    <Alert severity="error" sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            ❌ Errores Globales ({results.errors.length})
                        </Typography>
                        <List dense>
                            {results.errors.map((error, idx) => (
                                <ListItem key={idx}>
                                    <ListItemText
                                        primary={`${error.file}: ${error.error}`}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="contained" color="primary" size="large">
                    Cerrar Reporte
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DetailedProcessingReport;

