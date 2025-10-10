import { CloudUpload, FileUpload } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGeofences } from '../../hooks/useGeofences';

interface GeofenceImporterProps {
    onSuccess?: () => void;
    onClose?: () => void;
}

export const GeofenceImporter: React.FC<GeofenceImporterProps> = ({
    onSuccess,
    onClose,
}) => {
    const { t } = useTranslation();
    const { importFromRadar, fetchGeofences } = useGeofences();

    const [open, setOpen] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setJsonInput('');
        setError(null);
        setSuccess(null);
        onClose?.();
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setJsonInput(content);
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        if (!jsonInput.trim()) {
            setError('Por favor, pega o sube un archivo JSON válido');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Parsear el JSON
            const geofenceData = JSON.parse(jsonInput);

            // Validar que tenga los campos mínimos
            if (!geofenceData.description || !geofenceData.geometry) {
                throw new Error('El JSON debe contener al menos "description" y "geometry"');
            }

            // Importar la geocerca
            await importFromRadar(geofenceData);

            // Recargar la lista
            await fetchGeofences();

            setSuccess(`Geocerca "${geofenceData.description}" importada exitosamente`);
            setJsonInput('');

            setTimeout(() => {
                handleClose();
                onSuccess?.();
            }, 2000);

        } catch (err) {
            if (err instanceof SyntaxError) {
                setError('El JSON no es válido. Verifica la sintaxis.');
            } else {
                setError(err instanceof Error ? err.message : 'Error desconocido al importar');
            }
        } finally {
            setLoading(false);
        }
    };

    const exampleJson = `{
  "_id": "example-id",
  "description": "Ejemplo de Geocerca",
  "tag": "ejemplo",
  "type": "polygon",
  "mode": "car",
  "enabled": true,
  "live": true,
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [-3.7038, 40.4168],
      [-3.7030, 40.4168],
      [-3.7030, 40.4175],
      [-3.7038, 40.4175],
      [-3.7038, 40.4168]
    ]]
  },
  "geometryCenter": {
    "type": "Point",
    "coordinates": [-3.7038, 40.4168]
  }
}`;

    return (
        <>
            <Button
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={handleOpen}
                sx={{ mb: 2 }}
            >
                Importar Geocerca
            </Button>

            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <FileUpload />
                        <Typography variant="h6">
                            Importar Geocerca desde JSON
                        </Typography>
                    </Box>
                </DialogTitle>

                <DialogContent>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Puedes importar una geocerca pegando el JSON directamente o subiendo un archivo.
                        </Typography>

                        {/* Subida de archivo */}
                        <Box sx={{ mb: 3 }}>
                            <input
                                accept=".json"
                                style={{ display: 'none' }}
                                id="geofence-file-upload"
                                type="file"
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="geofence-file-upload">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    startIcon={<FileUpload />}
                                    size="small"
                                >
                                    Subir archivo JSON
                                </Button>
                            </label>
                        </Box>

                        {/* Campo de texto JSON */}
                        <TextField
                            fullWidth
                            multiline
                            rows={12}
                            variant="outlined"
                            label="JSON de la Geocerca"
                            placeholder="Pega aquí el JSON de la geocerca..."
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            sx={{ mb: 2 }}
                        />

                        {/* Ejemplo de JSON */}
                        <Card variant="outlined" sx={{ mb: 2 }}>
                            <CardContent>
                                <Typography variant="subtitle2" gutterBottom>
                                    Ejemplo de formato JSON:
                                </Typography>
                                <Box
                                    component="pre"
                                    sx={{
                                        fontSize: '0.75rem',
                                        backgroundColor: 'grey.100',
                                        p: 1,
                                        borderRadius: 1,
                                        overflow: 'auto',
                                        maxHeight: 200,
                                    }}
                                >
                                    {exampleJson}
                                </Box>
                            </CardContent>
                        </Card>

                        {/* Alertas */}
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
                    </Box>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleImport}
                        variant="contained"
                        disabled={loading || !jsonInput.trim()}
                        startIcon={loading ? <CircularProgress size={20} /> : <CloudUpload />}
                    >
                        {loading ? 'Importando...' : 'Importar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
