
import {
    CloudUpload as CloudUploadIcon,
    FlashOn as RotativoIcon,
    Memory as MemoryIcon,
    Public as GpsIcon,
    ShowChart as StabilityIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Step,
    StepLabel,
    Stepper,
    Tab,
    Tabs,
    Typography
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import { useEffect, useState, type ReactNode, type SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import MassUpload from '../components/MassUpload';
import type { ApiResponse } from '../types/api';
import { apiService } from '../services/api';

interface Vehicle {
    id: string;
    name?: string;
}

interface UploadResponse {
    sessionId: string;
    sessionNumber?: number;
    vehicleId: string;
}

type UploadApiResponse = ApiResponse<UploadResponse> & { warnings?: string[] };

type DataTypeValue = 'stability' | 'gps' | 'rotativo' | 'can';

interface DataTypeOption {
    value: DataTypeValue;
    label: string;
    description: string;
    color: string;
    fieldName: string;
    icon: ReactNode;
}

const DATA_TYPES: DataTypeOption[] = [
    {
        value: 'stability',
        label: 'Estabilidad',
        description: 'Lecturas de acelerómetros/giroscopios (ax, ay, az, roll, pitch, yaw, etc.)',
        color: '#3f51b5',
        fieldName: 'stabilityFile',
        icon: <StabilityIcon fontSize="large" color="primary" />
    },
    {
        value: 'gps',
        label: 'GPS',
        description: 'Datos de posicionamiento (Latitud, Longitud, Velocidad, Fix, satélites)',
        color: '#ff9800',
        fieldName: 'gpsFile',
        icon: <GpsIcon fontSize="large" color="warning" />
    },
    {
        value: 'rotativo',
        label: 'Rotativo',
        description: 'Estados ON/OFF del rotativo (Fecha-Hora;Estado)',
        color: '#d81b60',
        fieldName: 'rotativoFile',
        icon: <RotativoIcon fontSize="large" color="secondary" />
    },
    {
        value: 'can',
        label: 'Datos CAN',
        description: 'Parámetros del bus CAN (velocidad, RPM, consumos, etc.)',
        color: '#4caf50',
        fieldName: 'canFile',
        icon: <MemoryIcon fontSize="large" color="success" />
    }
];

const steps = ['Subir archivos', 'Procesar datos'];

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1
});

const LinearProgress = ({ value }: { value: number }) => (
    <Box sx={{ width: '100%' }}>
        <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
            <Box
                sx={{
                    width: `${value}%`,
                    height: 10,
                    bgcolor: 'primary.main',
                    transition: 'width 0.3s ease-in-out'
                }}
            />
        </Box>
    </Box>
);

const UploadData = () => {
    const navigate = useNavigate();

    const [activeStep, setActiveStep] = useState(0);
    const [selectedTab, setSelectedTab] = useState(0);
    const [uploadType, setUploadType] = useState<DataTypeValue>('stability');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [vehicleLoadError, setVehicleLoadError] = useState<string | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<string>('');

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await apiService.get<Vehicle[]>('/api/vehicles');
                if (response.success && Array.isArray(response.data)) {
                    setVehicles(response.data);
                    const stored = localStorage.getItem('selectedVehicle');
                    if (stored && response.data.some((vehicle) => vehicle.id === stored)) {
                        setSelectedVehicle(stored);
                    } else if (response.data.length > 0) {
                        const defaultId = response.data[0].id;
                        setSelectedVehicle(defaultId);
                        localStorage.setItem('selectedVehicle', defaultId);
                    }
                } else {
                    setVehicleLoadError(response.error ?? 'No se pudieron obtener los vehículos disponibles.');
                }
            } catch (err) {
                setVehicleLoadError('No se pudieron obtener los vehículos disponibles.');
            }
        };

        fetchVehicles();
    }, []);

    useEffect(() => {
        setSelectedFile(null);
        setWarnings([]);
        setError(null);
    }, [uploadType]);

    const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
        setSelectedTab(newValue);
        setError(null);
        setWarnings([]);
        setSelectedFile(null);
        setActiveStep(0);
        setProcessingProgress(0);
    };

    const handleVehicleChange = (event: SelectChangeEvent<string>) => {
        const value = event.target.value;
        setSelectedVehicle(value);
        localStorage.setItem('selectedVehicle', value);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setError(null);
        }
    };

    const handleNext = () => {
        setActiveStep((previous) => {
            if (previous === 0) {
                simulateProcessing();
            }
            return Math.min(previous + 1, steps.length - 1);
        });
    };

    const handleBack = () => {
        setActiveStep((previous) => Math.max(previous - 1, 0));
    };

    const simulateProcessing = () => {
        setProcessingProgress(0);
        const timer = setInterval(() => {
            setProcessingProgress((progress) => {
                const nextValue = Math.min(progress + 10, 100);
                if (nextValue === 100) {
                    clearInterval(timer);
                }
                return nextValue;
            });
        }, 400);
    };

    const handleUpload = async () => {
        if (!selectedVehicle) {
            setError('Selecciona un vehículo antes de subir archivos.');
            return;
        }

        if (!selectedFile) {
            setError('Por favor selecciona un archivo en formato .txt.');
            return;
        }

        setLoading(true);
        setError(null);
        setWarnings([]);
        setProcessingProgress(0);

        try {
            const option = DATA_TYPES.find((type) => type.value === uploadType) ?? DATA_TYPES[0];
            const formData = new FormData();
            formData.append('vehicleId', selectedVehicle);
            formData.append(option.fieldName, selectedFile);

            const response = (await apiService.post<UploadResponse>(
                '/api/sessions/upload',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    },
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            setProcessingProgress(percentCompleted);
                        }
                    }
                }
            )) as UploadApiResponse;

            if (response.success) {
                if (response.warnings && response.warnings.length > 0) {
                    setWarnings(response.warnings);
                }
                handleNext();
                setSelectedFile(null);

                if (response.data?.sessionId) {
                    navigate(`/stability/session/${response.data.sessionId}`);
                }
            } else {
                setError(response.error ?? response.message ?? 'Error al subir el archivo.');
            }
        } catch (err: any) {
            const errorMessage =
                err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Error al subir el archivo.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const selectedType = DATA_TYPES.find((type) => type.value === uploadType) ?? DATA_TYPES[0];

    return (
        <Box sx={{ p: { xs: 2, md: 3 } }}>
            <BackButton label="Volver" />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Subida manual de sesiones
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Carga directamente los archivos TXT originales de Estabilidad, GPS y Rotativo. El backend detectará vehículo, tipo y sesiones automáticamente.
                    </Typography>
                </Box>
            </Box>

            <Tabs value={selectedTab} onChange={handleTabChange} variant="scrollable" scrollButtons allowScrollButtonsMobile sx={{ mb: 3 }}>
                <Tab label="Subida simple" />
                <Tab label="Subida masiva" />
                <Tab label="Procesamiento masivo (beta)" />
            </Tabs>

            {selectedTab === 0 && (
                <Card elevation={4}>
                    <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>

                        {vehicleLoadError && (
                            <Alert severity="warning" sx={{ mb: 3 }}>
                                {vehicleLoadError}
                            </Alert>
                        )}

                        {activeStep === 0 && (
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    Selecciona el vehículo y el tipo de archivo
                                </Typography>

                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3 }}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="vehicle-select-label">Vehículo</InputLabel>
                                        <Select
                                            labelId="vehicle-select-label"
                                            value={selectedVehicle}
                                            label="Vehículo"
                                            onChange={handleVehicleChange}
                                            disabled={vehicles.length === 0}
                                        >
                                            {vehicles.map((vehicle) => (
                                                <MenuItem key={vehicle.id} value={vehicle.id}>
                                                    {vehicle.name ?? vehicle.id}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>

                                <Box sx={{ mb: 4 }}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        Tipo de archivo a subir
                                    </Typography>
                                    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
                                        {DATA_TYPES.map((type) => (
                                            <Paper
                                                key={type.value}
                                                elevation={uploadType === type.value ? 6 : 1}
                                                onClick={() => setUploadType(type.value)}
                                                sx={{
                                                    p: 2.5,
                                                    cursor: 'pointer',
                                                    borderRadius: 2,
                                                    border: uploadType === type.value ? `2px solid ${type.color}` : '1px solid transparent',
                                                    transition: 'all 0.2s ease-in-out',
                                                    backgroundColor: uploadType === type.value ? `${type.color}14` : 'background.paper',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: 6
                                                    }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                                    {type.icon}
                                                    <Typography variant="h6" sx={{ color: type.color }}>
                                                        {type.label}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {type.description}
                                                </Typography>
                                            </Paper>
                                        ))}
                                    </Box>
                                </Box>

                                <Box sx={{ textAlign: 'center', mb: 2 }}>
                                    <Button
                                        component="label"
                                        variant="contained"
                                        size="large"
                                        startIcon={<CloudUploadIcon />}
                                        sx={{
                                            minWidth: 260,
                                            background: `linear-gradient(45deg, ${selectedType.color} 30%, ${selectedType.color}dd 90%)`,
                                            boxShadow: '0 3px 5px 2px rgba(0,0,0,.3)',
                                            '&:hover': {
                                                background: `linear-gradient(45deg, ${selectedType.color}dd 30%, ${selectedType.color} 90%)`
                                            }
                                        }}
                                    >
                                        {selectedFile ? selectedFile.name : `Seleccionar archivo ${selectedType.label}`}
                                        <VisuallyHiddenInput accept=".txt" type="file" onChange={handleFileChange} />
                                    </Button>
                                </Box>

                                {selectedFile && (
                                    <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
                                        {`Archivo seleccionado: ${selectedFile.name}`}
                                    </Typography>
                                )}

                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                                    <Button
                                        variant="contained"
                                        onClick={handleUpload}
                                        disabled={loading || !selectedFile || !selectedVehicle}
                                        sx={{ minWidth: 200 }}
                                    >
                                        {loading ? 'Subiendo…' : 'Subir archivo'}
                                    </Button>
                                    {activeStep > 0 && (
                                        <Button variant="outlined" onClick={handleBack} disabled={loading}>
                                            Volver
                                        </Button>
                                    )}
                                </Box>

                                {error && (
                                    <Alert severity="error" sx={{ mt: 3 }}>
                                        {error}
                                    </Alert>
                                )}

                                {warnings.length > 0 && (
                                    <Alert severity="warning" sx={{ mt: 3 }}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Advertencias detectadas durante la subida:
                                        </Typography>
                                        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                            {warnings.map((warning, index) => (
                                                <li key={index}>
                                                    <Typography variant="body2">{warning}</Typography>
                                                </li>
                                            ))}
                                        </ul>
                                    </Alert>
                                )}
                            </Box>
                        )}

                        {activeStep === 1 && (
                            <Box textAlign="center">
                                <Typography variant="h6" gutterBottom>
                                    Procesando datos…
                                </Typography>
                                <Box sx={{ width: '100%', mt: 2 }}>
                                    <LinearProgress value={processingProgress} />
                                </Box>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    {processingProgress}% completado
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            )}

            {selectedTab === 1 && <MassUpload />}

            {selectedTab === 2 && (
                <Box sx={{ p: 3 }}>
                    <Typography variant="h4" gutterBottom color="primary">
                        Procesamiento masivo de datos (beta)
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        Esta pestaña se encuentra en modo prueba para validar integraciones masivas. Usa la pestaña "Subida simple" para cargar sesiones manuales.
                    </Typography>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="body2">
                            <strong>Estado:</strong> Pestaña funcionando correctamente.<br />
                            <strong>Timestamp:</strong> {new Date().toLocaleString()}
                        </Typography>
                    </Alert>
                    <Button variant="contained" size="large" color="primary" disabled>
                        Procesar datos (próximamente)
                    </Button>
                </Box>
            )}
        </Box>
    );
};

export default UploadData;
