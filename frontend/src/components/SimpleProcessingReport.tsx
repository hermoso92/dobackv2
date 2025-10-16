/**
 * 📊 REPORTE SIMPLE Y CLARO DE PROCESAMIENTO
 * 
 * Formato solicitado:
 * - VEHÍCULO → FECHA → SESIÓN → ARCHIVOS + HORA
 * - Sesiones NO procesadas con razón clara
 * 
 * @version 3.0 - SIMPLE
 * @date 2025-10-12
 */

import {
    CheckCircle as CheckIcon,
    ErrorOutline as EventIcon,
    Description as FileIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    List,
    ListItem,
    Stack,
    Typography
} from '@mui/material';
import React from 'react';

interface SessionEvent {
    type: string;
    severity: string;
    timestamp: string | Date;
    lat?: number;
    lon?: number;
}

interface FileDetail {
    fileName: string;
    sessionNumber: number;
    startTime: string;
    endTime: string;
    durationSeconds: number;
    durationFormatted: string;
    measurements: number;
}

interface SessionDetail {
    sessionNumber: number;
    sessionId: string;
    startTime: string;
    endTime: string;
    durationSeconds?: number;
    durationFormatted?: string;
    measurements: number;
    status: 'CREADA' | 'OMITIDA' | 'ERROR';
    reason: string;
    // Estructura de archivos (V2)
    estabilidad?: FileDetail | null;
    gps?: FileDetail | null;
    rotativo?: FileDetail | null;
    // Estructura legacy (V1)
    archivos?: {
        estabilidad: string | null;
        gps: string | null;
        rotativo: string | null;
    };
    // Post-procesamiento
    eventsGenerated?: number;
    events?: SessionEvent[];
    segmentsGenerated?: number;
}

interface VehicleResult {
    vehicle: string;
    savedSessions: number;
    skippedSessions: number;
    sessionDetails?: SessionDetail[];
}

interface SimpleProcessingReportProps {
    open: boolean;
    onClose: () => void;
    results: {
        totalSaved?: number;
        totalSkipped?: number;
        results?: VehicleResult[];
    };
}

export const SimpleProcessingReport: React.FC<SimpleProcessingReportProps> = ({
    open,
    onClose,
    results
}) => {
    const formatTime = (isoTime: string) => {
        try {
            const date = new Date(isoTime);
            return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return isoTime;
        }
    };

    const formatDate = (isoTime: string) => {
        try {
            const date = new Date(isoTime);
            return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch {
            return 'Fecha desconocida';
        }
    };

    // Agrupar sesiones por vehículo y fecha
    const groupedSessions: Record<string, Record<string, SessionDetail[]>> = {};

    // ✅ Verificar que results existe antes de acceder a sus propiedades
    if (results && results.results) {
        results.results.forEach((vehicleResult) => {
            if (!vehicleResult.sessionDetails) return;

            vehicleResult.sessionDetails.forEach(session => {
                const vehicle = vehicleResult.vehicle;
                const date = formatDate(session.startTime);

                if (!groupedSessions[vehicle]) {
                    groupedSessions[vehicle] = {};
                }
                if (!groupedSessions[vehicle][date]) {
                    groupedSessions[vehicle][date] = [];
                }
                groupedSessions[vehicle][date].push(session);
            });
        });
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Typography variant="h5" component="div" gutterBottom>
                    📊 Reporte de Procesamiento
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Chip
                        icon={<CheckIcon />}
                        label={`${results?.totalSaved || 0} Sesiones Creadas`}
                        color="success"
                        variant="outlined"
                    />
                    <Chip
                        icon={<WarningIcon />}
                        label={`${results?.totalSkipped || 0} Sesiones Omitidas`}
                        color="warning"
                        variant="outlined"
                    />
                </Stack>
            </DialogTitle>

            <DialogContent>
                {Object.keys(groupedSessions).length === 0 ? (
                    <Typography color="text.secondary" align="center">
                        No hay sesiones procesadas
                    </Typography>
                ) : (
                    Object.entries(groupedSessions).map(([vehicle, dates]) => (
                        <Box key={vehicle} sx={{ mb: 4 }}>
                            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                                🚗 {vehicle}
                            </Typography>

                            {Object.entries(dates).map(([date, sessions]) => {
                                const creadas = sessions.filter(s => s.status === 'CREADA');
                                const omitidas = sessions.filter(s => s.status === 'OMITIDA' || s.status === 'ERROR');

                                return (
                                    <Card key={date} sx={{ mb: 3, backgroundColor: 'grey.50' }}>
                                        <Box sx={{ p: 2 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                                                📅 {date}
                                            </Typography>

                                            {/* SESIONES CREADAS */}
                                            {creadas.length > 0 && (
                                                <>
                                                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'success.main' }}>
                                                        ✅ Sesiones Creadas ({creadas.length}):
                                                    </Typography>
                                                    {creadas.map((session, idx) => (
                                                        <Card
                                                            key={session.sessionId || `creada-${idx}`}
                                                            sx={{
                                                                mb: 2,
                                                                backgroundColor: 'success.50',
                                                                border: '1px solid',
                                                                borderColor: 'success.main'
                                                            }}
                                                        >
                                                            <Box sx={{ p: 2 }}>
                                                                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                                                    📍 Sesión {session.sessionNumber} ({formatTime(session.startTime)} → {formatTime(session.endTime)})
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                                                                    {(session.measurements || 0).toLocaleString()} mediciones totales
                                                                    {session.durationFormatted && ` • Duración: ${session.durationFormatted}`}
                                                                </Typography>

                                                                {/* ✅ NUEVO: Detalles por archivo */}
                                                                <List dense sx={{ mt: 1 }}>
                                                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                                                        📄 Archivos procesados:
                                                                    </Typography>

                                                                    {/* ESTABILIDAD */}
                                                                    {session.estabilidad ? (
                                                                        <ListItem sx={{ py: 0.5, pl: 2, display: 'block' }}>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                                                <FileIcon sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                                                                                <Typography variant="body2">
                                                                                    <strong>ESTABILIDAD:</strong> {session.estabilidad.fileName}
                                                                                </Typography>
                                                                            </Box>
                                                                            <Typography variant="caption" sx={{ pl: 3.5, color: 'text.secondary', display: 'block' }}>
                                                                                Sesión #{session.estabilidad.sessionNumber} •
                                                                                {session.estabilidad.startTime} → {session.estabilidad.endTime} •
                                                                                {session.estabilidad.durationFormatted} •
                                                                                {(session.estabilidad.measurements || 0).toLocaleString()} mediciones
                                                                            </Typography>
                                                                        </ListItem>
                                                                    ) : session.archivos?.estabilidad && (
                                                                        <ListItem sx={{ py: 0.5, pl: 2 }}>
                                                                            <FileIcon sx={{ mr: 1, color: 'primary.main', fontSize: 18 }} />
                                                                            <Typography variant="body2">
                                                                                <strong>ESTABILIDAD:</strong> {session.archivos.estabilidad}
                                                                            </Typography>
                                                                        </ListItem>
                                                                    )}

                                                                    {/* GPS */}
                                                                    {session.gps ? (
                                                                        <ListItem sx={{ py: 0.5, pl: 2, display: 'block' }}>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                                                <FileIcon sx={{ mr: 1, color: 'success.main', fontSize: 18 }} />
                                                                                <Typography variant="body2">
                                                                                    <strong>GPS:</strong> {session.gps.fileName}
                                                                                </Typography>
                                                                            </Box>
                                                                            <Typography variant="caption" sx={{ pl: 3.5, color: 'text.secondary', display: 'block' }}>
                                                                                Sesión #{session.gps.sessionNumber} •
                                                                                {session.gps.startTime} → {session.gps.endTime} •
                                                                                {session.gps.durationFormatted} •
                                                                                {(session.gps.measurements || 0).toLocaleString()} mediciones
                                                                            </Typography>
                                                                        </ListItem>
                                                                    ) : (
                                                                        <ListItem sx={{ py: 0.5, pl: 2 }}>
                                                                            <WarningIcon sx={{ mr: 1, color: 'warning.main', fontSize: 18 }} />
                                                                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                                                <strong>GPS:</strong> [sin datos GPS]
                                                                            </Typography>
                                                                        </ListItem>
                                                                    )}

                                                                    {/* ROTATIVO */}
                                                                    {session.rotativo ? (
                                                                        <ListItem sx={{ py: 0.5, pl: 2, display: 'block' }}>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                                                <FileIcon sx={{ mr: 1, color: 'info.main', fontSize: 18 }} />
                                                                                <Typography variant="body2">
                                                                                    <strong>ROTATIVO:</strong> {session.rotativo.fileName}
                                                                                </Typography>
                                                                            </Box>
                                                                            <Typography variant="caption" sx={{ pl: 3.5, color: 'text.secondary', display: 'block' }}>
                                                                                Sesión #{session.rotativo.sessionNumber} •
                                                                                {session.rotativo.startTime} → {session.rotativo.endTime} •
                                                                                {session.rotativo.durationFormatted} •
                                                                                {(session.rotativo.measurements || 0).toLocaleString()} mediciones
                                                                            </Typography>
                                                                        </ListItem>
                                                                    ) : session.archivos?.rotativo && (
                                                                        <ListItem sx={{ py: 0.5, pl: 2 }}>
                                                                            <FileIcon sx={{ mr: 1, color: 'info.main', fontSize: 18 }} />
                                                                            <Typography variant="body2">
                                                                                <strong>ROTATIVO:</strong> {session.archivos.rotativo}
                                                                            </Typography>
                                                                        </ListItem>
                                                                    )}
                                                                </List>

                                                                {/* ✅ EVENTOS DE ESTABILIDAD DETECTADOS */}
                                                                {session.eventsGenerated !== undefined && session.eventsGenerated > 0 && (
                                                                    <Box sx={{ mt: 2, p: 1.5, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #1976d2' }}>
                                                                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                                                                            <EventIcon sx={{ fontSize: 20, color: '#1976d2' }} />
                                                                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                                                                {session.eventsGenerated} Eventos de estabilidad detectados
                                                                            </Typography>
                                                                        </Stack>

                                                                        {session.events && session.events.length > 0 ? (
                                                                            <Box>
                                                                                <Typography variant="caption" sx={{ pl: 1, color: 'text.secondary', fontWeight: 'bold', display: 'block', mb: 1 }}>
                                                                                    Primeros {Math.min(10, session.events.length)} eventos:
                                                                                </Typography>
                                                                                <List dense sx={{ pl: 0 }}>
                                                                                    {session.events.map((event, eventIdx) => {
                                                                                        const severityConfig = {
                                                                                            'CRÍTICA': { color: '#d32f2f', bg: '#ffebee', label: '🔴 CRÍTICO' },
                                                                                            'GRAVE': { color: '#d32f2f', bg: '#ffebee', label: '🔴 GRAVE' },
                                                                                            'MODERADA': { color: '#f57c00', bg: '#fff3e0', label: '🟠 MODERADA' },
                                                                                            'LEVE': { color: '#0288d1', bg: '#e1f5fe', label: '🟡 LEVE' }
                                                                                        };
                                                                                        const config = severityConfig[event.severity as keyof typeof severityConfig] ||
                                                                                            { color: '#757575', bg: '#f5f5f5', label: '⚪ ' + event.severity };

                                                                                        return (
                                                                                            <ListItem
                                                                                                key={eventIdx}
                                                                                                sx={{
                                                                                                    py: 0.5,
                                                                                                    px: 1,
                                                                                                    mb: 0.5,
                                                                                                    backgroundColor: config.bg,
                                                                                                    borderRadius: 0.5,
                                                                                                    border: `1px solid ${config.color}40`
                                                                                                }}
                                                                                            >
                                                                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                                                                                                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: config.color, minWidth: '95px' }}>
                                                                                                        {config.label}
                                                                                                    </Typography>
                                                                                                    <Typography variant="caption" sx={{ flex: 1 }}>
                                                                                                        {event.type.replace(/_/g, ' ')}
                                                                                                    </Typography>
                                                                                                    {event.lat && event.lon && (
                                                                                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                                                                                            📍 {event.lat.toFixed(5)}, {event.lon.toFixed(5)}
                                                                                                        </Typography>
                                                                                                    )}
                                                                                                </Stack>
                                                                                            </ListItem>
                                                                                        );
                                                                                    })}
                                                                                    {session.eventsGenerated > session.events.length && (
                                                                                        <ListItem sx={{ py: 0.5, px: 1 }}>
                                                                                            <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary', fontWeight: 'bold' }}>
                                                                                                ... y {session.eventsGenerated - session.events.length} eventos más (total: {session.eventsGenerated})
                                                                                            </Typography>
                                                                                        </ListItem>
                                                                                    )}
                                                                                </List>
                                                                            </Box>
                                                                        ) : (
                                                                            <Typography variant="caption" sx={{ pl: 1, color: 'text.secondary', fontStyle: 'italic' }}>
                                                                                {session.eventsGenerated} eventos detectados (no hay detalles disponibles)
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                )}

                                                                {/* Segmentos operacionales */}
                                                                {session.segmentsGenerated !== undefined && session.segmentsGenerated > 0 && (
                                                                    <Box sx={{ mt: 1, p: 1, backgroundColor: 'grey.100', borderRadius: 1 }}>
                                                                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                                                            ✅ {session.segmentsGenerated} Segmentos operacionales generados
                                                                        </Typography>
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        </Card>
                                                    ))}
                                                </>
                                            )}

                                            {/* SESIONES NO PROCESADAS */}
                                            {omitidas.length > 0 && (
                                                <>
                                                    <Divider sx={{ my: 2 }} />
                                                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'warning.main' }}>
                                                        ⚠️ Sesiones NO procesadas ({omitidas.length}):
                                                    </Typography>
                                                    {omitidas.map((session, idx) => (
                                                        <Card
                                                            key={session.sessionId || `omitida-${idx}`}
                                                            sx={{
                                                                mb: 1,
                                                                backgroundColor: 'warning.50',
                                                                border: '1px solid',
                                                                borderColor: 'warning.main'
                                                            }}
                                                        >
                                                            <Box sx={{ p: 1.5 }}>
                                                                <Typography variant="body2">
                                                                    <strong>Sesión {session.sessionNumber}:</strong> {session.reason}
                                                                </Typography>
                                                            </Box>
                                                        </Card>
                                                    ))}
                                                </>
                                            )}
                                        </Box>
                                    </Card>
                                );
                            })}
                        </Box>
                    ))
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} variant="contained">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SimpleProcessingReport;

