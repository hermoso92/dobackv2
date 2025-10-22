/**
 * 🤖 PESTAÑA DE PROCESAMIENTO AUTOMÁTICO
 * 
 * Interfaz para procesamiento automático de todos los vehículos
 * 
 * @version 1.0
 * @date 2025-10-22
 */

import { Assessment as AssessmentIcon, PlayArrow as PlayArrowIcon } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    LinearProgress,
    Typography
} from '@mui/material';
import React from 'react';
import { SimpleProcessingReport } from '../SimpleProcessingReport';
import { UploadConfigPanel } from '../UploadConfigPanel';

interface Props {
    isProcessing: boolean;
    progress: number;
    results: any;
    error: string | null;
    showReportModal: boolean;
    setShowReportModal: (show: boolean) => void;
    handleAutoProcess: () => Promise<void>;
    handleViewLastReport: () => Promise<void>;
}

export const AutoProcessTab: React.FC<Props> = ({
    isProcessing,
    progress,
    results,
    error,
    showReportModal,
    setShowReportModal,
    handleAutoProcess,
    handleViewLastReport
}) => {
    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Procesamiento Automático
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Procesa automáticamente todos los archivos de la carpeta CMadrid
            </Typography>

            {/* Panel de configuración */}
            <UploadConfigPanel />

            {/* Botones de acción */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAutoProcess}
                    disabled={isProcessing}
                    startIcon={isProcessing ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                    size="large"
                >
                    {isProcessing ? 'Procesando...' : 'Iniciar Procesamiento Automático'}
                </Button>
                <Button
                    variant="outlined"
                    color="success"
                    onClick={handleViewLastReport}
                    disabled={isProcessing}
                    startIcon={<AssessmentIcon />}
                    size="large"
                >
                    Ver Último Reporte
                </Button>
            </Box>

            {/* Barra de progreso */}
            {isProcessing && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                        Procesando archivos... {progress}%
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{ height: 8, borderRadius: 4 }}
                    />
                </Box>
            )}

            {/* Errores */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    <strong>Error:</strong> {error}
                </Alert>
            )}

            {/* Resultados */}
            {results && (
                <Alert severity="success">
                    <Typography variant="h6" gutterBottom>
                        ✅ Procesamiento Completado
                    </Typography>
                    <Typography variant="body2">
                        Sesiones guardadas: {results.totalSaved || 0}
                    </Typography>
                </Alert>
            )}

            {/* Modal de Reporte */}
            <SimpleProcessingReport
                open={showReportModal}
                onClose={() => setShowReportModal(false)}
                results={results}
            />
        </Box>
    );
};

