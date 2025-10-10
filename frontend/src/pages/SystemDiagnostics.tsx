import BugReportIcon from '@mui/icons-material/BugReport';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    TextField,
    Typography
} from '@mui/material';
import React, { useState } from 'react';

interface DiagnosticResult {
    data?: any;
    error?: string;
    analysis?: string;
}

const SystemDiagnostics: React.FC = () => {
    const [filtersResult, setFiltersResult] = useState<string>('');
    const [kpiResult, setKpiResult] = useState<DiagnosticResult>({});
    const [kpiFilteredResult, setKpiFilteredResult] = useState<DiagnosticResult>({});
    const [vehiclesResult, setVehiclesResult] = useState<DiagnosticResult>({});
    const [sessionsResult, setSessionsResult] = useState<DiagnosticResult>({});
    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

    const [fromDate, setFromDate] = useState('2025-01-01');
    const [toDate, setToDate] = useState('2025-12-31');

    const checkFilters = () => {
        const filters = localStorage.getItem('globalFilters');

        if (!filters) {
            setFiltersResult('⚠️ No hay filtros guardados en localStorage');
            return;
        }

        try {
            const parsed = JSON.parse(filters);
            setFiltersResult(JSON.stringify(parsed, null, 2));
        } catch (error: any) {
            setFiltersResult('❌ Error parseando filtros: ' + error.message);
        }
    };

    const analyzeKPIs = (data: any): string => {
        let analysis = '';

        // Analizar estados
        if (data.states) {
            analysis += '\n🔑 ESTADOS (Claves):\n';
            const states = data.states.states || [];
            states.forEach((s: any) => {
                analysis += `   Clave ${s.key} (${s.name}): ${s.duration_formatted}\n`;
            });
            analysis += `   TOTAL: ${data.states.total_time_formatted}\n`;
            analysis += `   Fuera de Parque (2+3+4+5): ${data.states.time_outside_formatted}\n`;
        }

        // Analizar actividad
        if (data.activity) {
            analysis += '\n🚗 ACTIVIDAD:\n';
            analysis += `   Kilómetros: ${data.activity.km_total} km\n`;
            analysis += `   Horas Conducción: ${data.activity.driving_hours_formatted}\n`;
            analysis += `   % Rotativo: ${data.activity.rotativo_on_percentage}%\n`;

            // Calcular velocidad promedio
            const avgSpeed = data.activity.driving_hours > 0
                ? (data.activity.km_total / data.activity.driving_hours).toFixed(2)
                : '0';
            analysis += `   Velocidad Promedio: ${avgSpeed} km/h\n`;

            // Alertas
            if (parseFloat(avgSpeed) > 200) {
                analysis += `   ⚠️  ALERTA: Velocidad promedio imposible (>${avgSpeed} km/h)\n`;
            }
            if (data.activity.driving_hours < 0.1) {
                analysis += `   ⚠️  ALERTA: Muy pocas horas de conducción (<6 minutos)\n`;
            }
        }

        // Analizar incidencias
        if (data.stability) {
            analysis += '\n⚠️  INCIDENCIAS:\n';
            analysis += `   Total: ${data.stability.total_incidents}\n`;
            analysis += `   Graves: ${data.stability.critical}\n`;
            analysis += `   Moderadas: ${data.stability.moderate}\n`;
            analysis += `   Leves: ${data.stability.light}\n`;

            if (data.stability.critical === 0 && data.stability.moderate === 0 && data.stability.light > 0) {
                analysis += `   ⚠️  ALERTA: Todas las incidencias son leves - revisar clasificación\n`;
            }
        }

        return analysis;
    };

    const testKPIEndpoint = async () => {
        setLoading({ ...loading, kpi: true });
        try {
            const response = await fetch('http://localhost:9998/api/kpis/summary', {
                headers: {
                    'x-organization-id': 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26'
                }
            });
            const data = await response.json();

            const analysis = data.data ? analyzeKPIs(data.data) : '';
            setKpiResult({ data, analysis });
        } catch (error: any) {
            setKpiResult({ error: error.message });
        } finally {
            setLoading({ ...loading, kpi: false });
        }
    };

    const testKPIEndpointWithFilters = async () => {
        setLoading({ ...loading, kpiFiltered: true });
        try {
            const response = await fetch(
                `http://localhost:9998/api/kpis/summary?from=${fromDate}&to=${toDate}`,
                {
                    headers: {
                        'x-organization-id': 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26'
                    }
                }
            );
            const data = await response.json();

            const analysis = data.data ? analyzeKPIs(data.data) : '';
            setKpiFilteredResult({ data, analysis });
        } catch (error: any) {
            setKpiFilteredResult({ error: error.message });
        } finally {
            setLoading({ ...loading, kpiFiltered: false });
        }
    };

    const getVehicles = async () => {
        setLoading({ ...loading, vehicles: true });
        try {
            const response = await fetch('http://localhost:9998/api/vehicles', {
                headers: {
                    'x-organization-id': 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26'
                }
            });
            const data = await response.json();
            setVehiclesResult({ data });
        } catch (error: any) {
            setVehiclesResult({ error: error.message });
        } finally {
            setLoading({ ...loading, vehicles: false });
        }
    };

    const getSessions = async () => {
        setLoading({ ...loading, sessions: true });
        try {
            const response = await fetch('http://localhost:9998/api/sessions?limit=10', {
                headers: {
                    'x-organization-id': 'a5dfb0b4-c608-4a9e-b47b-d57a2e4d8c26'
                }
            });
            const data = await response.json();
            setSessionsResult({ data });
        } catch (error: any) {
            setSessionsResult({ error: error.message });
        } finally {
            setLoading({ ...loading, sessions: false });
        }
    };

    const renderResult = (result: DiagnosticResult) => {
        if (result.error) {
            return (
                <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 2 }}>
                    <Typography variant="body2">{result.error}</Typography>
                </Alert>
            );
        }

        if (result.data) {
            return (
                <Box sx={{ mt: 2 }}>
                    <Typography
                        component="pre"
                        sx={{
                            backgroundColor: '#f5f5f5',
                            p: 2,
                            borderRadius: 1,
                            overflow: 'auto',
                            fontSize: '0.875rem',
                            maxHeight: '400px'
                        }}
                    >
                        {JSON.stringify(result.data, null, 2)}
                    </Typography>

                    {result.analysis && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" gutterBottom>
                                📊 ANÁLISIS:
                            </Typography>
                            <Typography
                                component="pre"
                                sx={{
                                    backgroundColor: '#e3f2fd',
                                    p: 2,
                                    borderRadius: 1,
                                    fontSize: '0.875rem',
                                    whiteSpace: 'pre-wrap'
                                }}
                            >
                                {result.analysis}
                            </Typography>
                        </>
                    )}
                </Box>
            );
        }

        return null;
    };

    return (
        <Box sx={{ p: 3, maxWidth: '1400px', margin: '0 auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <BugReportIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                <Typography variant="h4" component="h1">
                    🔍 Diagnóstico del Sistema
                </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
                Esta herramienta permite verificar el estado del sistema, consultar endpoints del backend y diagnosticar problemas con los KPIs.
            </Alert>

            {/* 1. Verificar Filtros */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        1. Verificar Filtros Actuales
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Revisa los filtros guardados en localStorage
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={checkFilters}
                        startIcon={<RefreshIcon />}
                    >
                        Ver Filtros en LocalStorage
                    </Button>
                    {filtersResult && (
                        <Typography
                            component="pre"
                            sx={{
                                backgroundColor: '#f5f5f5',
                                p: 2,
                                borderRadius: 1,
                                mt: 2,
                                overflow: 'auto',
                                fontSize: '0.875rem'
                            }}
                        >
                            {filtersResult}
                        </Typography>
                    )}
                </CardContent>
            </Card>

            {/* 2. Consultar KPIs sin filtros */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        2. Consultar Endpoint KPIs (Sin Filtros)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        GET /api/kpis/summary
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={testKPIEndpoint}
                        disabled={loading.kpi}
                        startIcon={loading.kpi ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                    >
                        {loading.kpi ? 'Consultando...' : 'Consultar KPIs'}
                    </Button>
                    {renderResult(kpiResult)}
                </CardContent>
            </Card>

            {/* 3. Consultar KPIs con filtros */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        3. Consultar Endpoint KPIs (Con Filtros)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        GET /api/kpis/summary?from=...&to=...
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <TextField
                            label="Desde"
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Hasta"
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                    <Button
                        variant="contained"
                        onClick={testKPIEndpointWithFilters}
                        disabled={loading.kpiFiltered}
                        startIcon={loading.kpiFiltered ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                    >
                        {loading.kpiFiltered ? 'Consultando...' : 'Consultar KPIs con Filtros'}
                    </Button>
                    {renderResult(kpiFilteredResult)}
                </CardContent>
            </Card>

            {/* 4. Ver Vehículos */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        4. Ver Vehículos Disponibles
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        GET /api/vehicles
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={getVehicles}
                        disabled={loading.vehicles}
                        startIcon={loading.vehicles ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                    >
                        {loading.vehicles ? 'Consultando...' : 'Consultar Vehículos'}
                    </Button>
                    {renderResult(vehiclesResult)}
                </CardContent>
            </Card>

            {/* 5. Ver Sesiones */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        5. Ver Sesiones
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        GET /api/sessions?limit=10
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={getSessions}
                        disabled={loading.sessions}
                        startIcon={loading.sessions ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                    >
                        {loading.sessions ? 'Consultando...' : 'Consultar Sesiones'}
                    </Button>
                    {renderResult(sessionsResult)}
                </CardContent>
            </Card>

            {/* Leyenda de iconos */}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Interpretación de Resultados
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon color="success" />
                            <Typography variant="body2">
                                Valores correctos y dentro del rango esperado
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WarningIcon color="warning" />
                            <Typography variant="body2">
                                Valores cuestionables que requieren revisión
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ErrorIcon color="error" />
                            <Typography variant="body2">
                                Valores imposibles o errores críticos
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default SystemDiagnostics;

