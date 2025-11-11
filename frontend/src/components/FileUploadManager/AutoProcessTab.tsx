/**
 * 🤖 PESTAÑA DE PROCESAMIENTO AUTOMÁTICO
 * 
 * Interfaz para procesamiento automático de todos los vehículos
 * 
 * @version 1.0
 * @date 2025-10-22
 */

import {
    Assessment as AssessmentIcon,
    Delete as DeleteIcon,
    PlayArrow as PlayArrowIcon,
    WarningAmber as WarningAmberIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    CircularProgress,
    LinearProgress,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import { SimpleProcessingReport } from '../SimpleProcessingReport';
import { UploadConfigPanel } from '../UploadConfigPanel';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { authService } from '../../services/auth';
import { logger } from '../../utils/logger';

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
    const { user } = useAuth();
    const currentUser = user ?? authService.getCurrentUser();
    const canManageDatabase = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

    const [showCleanDbDialog, setShowCleanDbDialog] = useState(false);
    const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
    const [isCleaningDb, setIsCleaningDb] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    const handleCleanDatabase = async () => {
        try {
            setIsCleaningDb(true);
            logger.warn('🧹 Limpiando base de datos (via AutoProcessTab)...');

            const response = await apiService.post('/api/clean-all-sessions', {});

            if (response.success) {
                logger.info('✅ Base de datos limpiada correctamente', response.data);
                alert('✅ Base de datos limpiada exitosamente');
            } else {
                throw new Error(response.error || 'Error limpiando la base de datos');
            }
        } catch (err: any) {
            const message = err?.response?.data?.error || err?.message || 'Error limpiando base de datos';
            logger.error('❌ Error limpiando base de datos desde AutoProcessTab', { message });
            alert(`❌ Error al limpiar base de datos: ${message}`);
        } finally {
            setIsCleaningDb(false);
            setShowCleanDbDialog(false);
        }
    };

    const handleDeleteAllData = async () => {
        try {
            setIsDeletingAll(true);
            logger.warn('🚨 Eliminando TODOS los datos (via AutoProcessTab)...');

            const response = await apiService.post('/api/admin/delete-all-data', {
                confirmacion: 'ELIMINAR_TODO'
            });

            if (response.success) {
                logger.info('✅ Todos los datos eliminados correctamente', response.data);
                alert('✅ Todos los datos han sido eliminados exitosamente');
            } else {
                throw new Error(response.error || 'Error borrando todos los datos');
            }
        } catch (err: any) {
            const message = err?.response?.data?.error || err?.message || 'Error eliminando los datos';
            logger.error('❌ Error eliminando todos los datos desde AutoProcessTab', { message });
            alert(`❌ Error al eliminar datos: ${message}`);
        } finally {
            setIsDeletingAll(false);
            setShowDeleteAllDialog(false);
        }
    };

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
                {canManageDatabase && (
                    <>
                        <Button
                            variant="outlined"
                            color="warning"
                            onClick={() => setShowCleanDbDialog(true)}
                            disabled={isProcessing || isCleaningDb || isDeletingAll}
                            startIcon={isCleaningDb ? <CircularProgress size={20} /> : <DeleteIcon />}
                        >
                            {isCleaningDb ? 'Limpiando...' : 'Limpiar Base de Datos'}
                        </Button>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={() => setShowDeleteAllDialog(true)}
                            disabled={isProcessing || isDeletingAll || isCleaningDb}
                            startIcon={isDeletingAll ? <CircularProgress size={20} /> : <DeleteIcon />}
                        >
                            {isDeletingAll ? 'Eliminando...' : 'Borrar Todos los Datos'}
                        </Button>
                    </>
                )}
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

            {/* Diálogo Limpiar Base de Datos */}
            {canManageDatabase && (
                <Dialog
                    open={showCleanDbDialog}
                    onClose={() => !isCleaningDb && setShowCleanDbDialog(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningAmberIcon color="warning" />
                        Limpiar Base de Datos
                    </DialogTitle>
                    <DialogContent dividers>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Esta acción eliminará todas las sesiones, mediciones y segmentos operacionales de tu organización.
                        </Typography>
                        <Alert severity="warning">
                            Esta operación no eliminará configuraciones administrativas, pero no se puede deshacer.
                        </Alert>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setShowCleanDbDialog(false)}
                            disabled={isCleaningDb}
                        >
                            Cancelar
                        </Button>
                        <Button
                            color="warning"
                            variant="contained"
                            onClick={handleCleanDatabase}
                            disabled={isCleaningDb}
                        >
                            {isCleaningDb ? 'Limpiando...' : 'Sí, limpiar'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Diálogo Borrar Todos los Datos */}
            {canManageDatabase && (
                <Dialog
                    open={showDeleteAllDialog}
                    onClose={() => !isDeletingAll && setShowDeleteAllDialog(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningAmberIcon color="error" />
                        Borrar Todos los Datos
                    </DialogTitle>
                    <DialogContent dividers>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Estás a punto de eliminar <strong>TODOS</strong> los datos de la organización, incluyendo:
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, mb: 2, '& li': { mb: 1 } }}>
                            <li>Sesiones y mediciones (GPS, CAN, Rotativo, Estabilidad)</li>
                            <li>Eventos de estabilidad y segmentos operacionales</li>
                            <li>KPIs y reportes generados</li>
                        </Box>
                        <Alert severity="error">
                            Esta acción es irreversible. Asegúrate de tener respaldo antes de continuar.
                        </Alert>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setShowDeleteAllDialog(false)}
                            disabled={isDeletingAll}
                        >
                            Cancelar
                        </Button>
                        <Button
                            color="error"
                            variant="contained"
                            onClick={handleDeleteAllData}
                            disabled={isDeletingAll}
                        >
                            {isDeletingAll ? 'Eliminando...' : 'Sí, borrar todo'}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </Box>
    );
};

