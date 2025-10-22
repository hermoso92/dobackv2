/**
 * 📤 PESTAÑA DE SUBIDA MANUAL
 * 
 * Interfaz para subir archivos individuales manualmente
 * 
 * @version 1.0
 * @date 2025-10-22
 */

import { Add as AddIcon, Delete as DeleteIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Typography
} from '@mui/material';
import React from 'react';

interface Props {
    selectedFiles: File[];
    uploading: boolean;
    uploadResult: any;
    uploadError: string | null;
    fileInputRef: React.RefObject<HTMLInputElement>;
    handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
    removeFile: (index: number) => void;
    clearAllFiles: () => void;
    handleMultipleUpload: () => Promise<void>;
}

export const ManualUploadTab: React.FC<Props> = ({
    selectedFiles,
    uploading,
    uploadResult,
    uploadError,
    fileInputRef,
    handleFileSelect,
    removeFile,
    clearAllFiles,
    handleMultipleUpload
}) => {
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Subida Manual de Archivos
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Sube múltiples archivos de datos de vehículos (Estabilidad, GPS, Rotativo, CAN)
            </Typography>

            <Card sx={{ mb: 4 }}>
                <CardContent>
                    {uploadError && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {uploadError}
                        </Alert>
                    )}

                    <Box
                        sx={{
                            border: '2px dashed',
                            borderColor: 'grey.300',
                            borderRadius: 2,
                            p: 4,
                            textAlign: 'center',
                            bgcolor: 'grey.50'
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".txt"
                            onChange={handleFileSelect}
                            multiple
                            style={{ display: 'none' }}
                            id="file-upload"
                        />
                        <label htmlFor="file-upload">
                            <Button
                                variant="contained"
                                component="span"
                                startIcon={<AddIcon />}
                                sx={{ mb: 2 }}
                            >
                                Seleccionar Archivos
                            </Button>
                        </label>

                        <Typography variant="body2" color="text.secondary">
                            Puedes seleccionar múltiples archivos a la vez
                        </Typography>

                        {selectedFiles.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Archivos seleccionados ({selectedFiles.length}):
                                </Typography>
                                <List dense>
                                    {selectedFiles.map((file, index) => (
                                        <ListItem key={index} sx={{ py: 0.5 }}>
                                            <ListItemText
                                                primary={file.name}
                                                secondary={formatFileSize(file.size)}
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    edge="end"
                                                    onClick={() => removeFile(index)}
                                                    color="error"
                                                    size="small"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>

                                <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
                                    <Button variant="outlined" onClick={clearAllFiles} size="small">
                                        Limpiar Todo
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        onClick={handleMultipleUpload}
                                        disabled={uploading}
                                        startIcon={<UploadIcon />}
                                    >
                                        {uploading ? 'Subiendo...' : `Subir ${selectedFiles.length} Archivos`}
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Box>

                    <Alert severity="info" sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Formatos de archivo esperados:
                        </Typography>
                        <Typography variant="body2">
                            <strong>Estabilidad:</strong> ESTABILIDAD_DOBACK###_YYYYMMDD.txt<br />
                            <strong>GPS:</strong> GPS_DOBACK###_YYYYMMDD.txt<br />
                            <strong>Rotativo:</strong> ROTATIVO_DOBACK###_YYYYMMDD.txt
                        </Typography>
                    </Alert>
                </CardContent>
            </Card>

            {uploadResult && (
                <Alert severity="success">
                    <Typography variant="h6" gutterBottom>
                        ✅ {uploadResult.totalFiles} Archivos Procesados Exitosamente
                    </Typography>
                    <Typography variant="body2">
                        Sesiones totales: {uploadResult.results.reduce((sum: number, r: any) => sum + r.totalSessions, 0)}
                    </Typography>
                </Alert>
            )}
        </Box>
    );
};

