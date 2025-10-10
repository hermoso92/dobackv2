import {
    CheckCircle as CheckIcon,
    Delete as DeleteIcon,
    Error as ErrorIcon,
    CloudUpload as UploadIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Paper,
    Typography
} from '@mui/material';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { apiService } from '../services/api';
import { logger } from '../utils/logger';

interface FileInfo {
    name: string;
    size: number;
    type: string;
    file: File;
}

interface VehicleGroup {
    vehicleName: string;
    date: string;
    files: {
        CAN: FileInfo[];
        GPS: FileInfo[];
        ESTABILIDAD: FileInfo[];
        ROTATIVO: FileInfo[];
    };
}

interface UploadResult {
    vehicleName: string;
    success: boolean;
    error?: string;
    sessionsCreated: number;
    filesProcessed: number;
}

const MassUpload: React.FC = () => {
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [vehicleGroups, setVehicleGroups] = useState<VehicleGroup[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles: FileInfo[] = acceptedFiles.map(file => ({
            name: file.name,
            size: file.size,
            type: getFileType(file.name),
            file
        }));

        setFiles(prev => [...prev, ...newFiles]);
        setError('');
        setSuccess('');
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/plain': ['.txt'],
            'text/csv': ['.csv']
        },
        multiple: true
    });

    const getFileType = (filename: string): string => {
        const upperName = filename.toUpperCase();
        if (upperName.includes('CAN')) return 'CAN';
        if (upperName.includes('GPS')) return 'GPS';
        if (upperName.includes('ESTABILIDAD')) return 'ESTABILIDAD';
        if (upperName.includes('ROTATIVO')) return 'ROTATIVO';
        return 'UNKNOWN';
    };

    const extractVehicleInfo = (filename: string): { vehicleName: string; date: string } | null => {
        // Patrón: TIPO_DOBACK<vehículo>_<YYYYMMDD>_<secuencia>
        const match = filename.match(/_(DOBACK\d+)_(\d{8})_/);

        if (match) {
            const vehicleName = match[1].toLowerCase(); // doback022
            const dateStr = match[2];
            const date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;

            return { vehicleName, date };
        }

        return null;
    };

    const groupFilesByVehicle = useCallback(() => {
        const groups: Map<string, VehicleGroup> = new Map();

        files.forEach(fileInfo => {
            const vehicleInfo = extractVehicleInfo(fileInfo.name);

            if (!vehicleInfo) {
                logger.warn(`No se pudo extraer información del archivo: ${fileInfo.name}`);
                return;
            }

            const { vehicleName, date } = vehicleInfo;
            const key = `${vehicleName}_${date}`;

            if (!groups.has(key)) {
                groups.set(key, {
                    vehicleName,
                    date,
                    files: {
                        CAN: [],
                        GPS: [],
                        ESTABILIDAD: [],
                        ROTATIVO: []
                    }
                });
            }

            const group = groups.get(key)!;
            const fileType = fileInfo.type as keyof typeof group.files;

            if (fileType in group.files) {
                group.files[fileType].push(fileInfo);
            }
        });

        setVehicleGroups(Array.from(groups.values()));
    }, [files]);

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const clearAllFiles = () => {
        setFiles([]);
        setVehicleGroups([]);
        setUploadResults([]);
        setError('');
        setSuccess('');
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            setError('No hay archivos para subir');
            return;
        }

        setUploading(true);
        setError('');
        setSuccess('');

        try {
            const formData = new FormData();

            // Agrupar archivos por tipo
            files.forEach(fileInfo => {
                const fileType = fileInfo.type;
                if (fileType !== 'UNKNOWN') {
                    formData.append(fileType, fileInfo.file);
                }
            });

            const response = await apiService.post('/api/mass-upload/upload-multiple', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                timeout: 600000 // 10 minutos para subidas grandes
            });

            if (response.success) {
                setSuccess(response.message || 'Archivos subidos correctamente');
                setUploadResults((response as any).results || []);
                setFiles([]);
                setVehicleGroups([]);
            } else {
                setError(response.error || 'Error al subir los archivos');
            }
        } catch (error: any) {
            logger.error('Error en subida masiva:', error);
            setError(error.message || 'Error al subir los archivos');
        } finally {
            setUploading(false);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                Subida Masiva de Archivos
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Sube múltiples archivos CAN, GPS, estabilidad y rotativo. El sistema los agrupará automáticamente por vehículo y fecha.
            </Typography>

            {/* Área de drag & drop */}
            <Paper
                {...getRootProps()}
                sx={{
                    p: 4,
                    textAlign: 'center',
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'grey.300',
                    backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                    cursor: 'pointer',
                    mb: 3
                }}
            >
                <input {...getInputProps()} />
                <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                    {isDragActive ? 'Suelta los archivos aquí' : 'Arrastra archivos aquí o haz clic para seleccionar'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Archivos soportados: .txt, .csv (CAN, GPS, ESTABILIDAD, ROTATIVO)
                </Typography>
            </Paper>

            {/* Archivos seleccionados */}
            {files.length > 0 && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                Archivos seleccionados ({files.length})
                            </Typography>
                            <Box>
                                <Button
                                    variant="outlined"
                                    onClick={groupFilesByVehicle}
                                    sx={{ mr: 1 }}
                                >
                                    Agrupar por Vehículo
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={clearAllFiles}
                                >
                                    Limpiar Todo
                                </Button>
                            </Box>
                        </Box>

                        <List>
                            {files.map((file, index) => (
                                <React.Fragment key={index}>
                                    <ListItem>
                                        <ListItemText
                                            primary={file.name}
                                            secondary={`${file.type} - ${formatFileSize(file.size)}`}
                                        />
                                        <ListItemSecondaryAction>
                                            <Chip
                                                label={file.type}
                                                color={file.type === 'UNKNOWN' ? 'error' : 'primary'}
                                                size="small"
                                                sx={{ mr: 1 }}
                                            />
                                            <IconButton
                                                edge="end"
                                                onClick={() => removeFile(index)}
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    {index < files.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            )}

            {/* Grupos de vehículos */}
            {vehicleGroups.length > 0 && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Archivos agrupados por vehículo ({vehicleGroups.length} grupos)
                        </Typography>

                        <Grid container spacing={2}>
                            {vehicleGroups.map((group, index) => (
                                <Grid item xs={12} md={6} key={index}>
                                    <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {group.vehicleName.toUpperCase()} - {group.date}
                                        </Typography>

                                        <Box sx={{ mt: 1 }}>
                                            {Object.entries(group.files).map(([type, files]) => (
                                                <Chip
                                                    key={type}
                                                    label={`${type}: ${files.length}`}
                                                    color={files.length > 0 ? 'success' : 'default'}
                                                    size="small"
                                                    sx={{ mr: 1, mb: 1 }}
                                                />
                                            ))}
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Botón de subida */}
            {files.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleUpload}
                        disabled={uploading}
                        startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
                        sx={{ minWidth: 200 }}
                    >
                        {uploading ? 'Subiendo...' : 'Subir Archivos'}
                    </Button>
                </Box>
            )}

            {/* Mensajes de estado */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                </Alert>
            )}

            {/* Resultados de la subida */}
            {uploadResults.length > 0 && (
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Resultados de la subida
                        </Typography>

                        <List>
                            {uploadResults.map((result, index) => (
                                <ListItem key={index}>
                                    <ListItemText
                                        primary={result.vehicleName.toUpperCase()}
                                        secondary={`${result.sessionsCreated} sesiones creadas, ${result.filesProcessed} archivos procesados`}
                                    />
                                    <ListItemSecondaryAction>
                                        {result.success ? (
                                            <CheckIcon color="success" />
                                        ) : (
                                            <ErrorIcon color="error" />
                                        )}
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default MassUpload; 