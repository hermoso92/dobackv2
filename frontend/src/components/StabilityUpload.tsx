import { AlertCircle, Loader2, Upload } from 'lucide-react';
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { useStability } from '../hooks/useStability';
import { t } from '../i18n';
import { Alert, AlertDescription, AlertTitle } from './ui/Alert';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface UploadError {
    code?: string;
    message: string;
    vehicleId?: string;
}

export const StabilityUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<UploadError | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();
    const { uploadStabilityData } = useStability();

    const onDrop = (acceptedFiles: File[]) => {
        setError(null);
        const selectedFile = acceptedFiles[0];

        if (selectedFile && !selectedFile.name.endsWith('.txt')) {
            setError({
                message: t('solo_txt')
            });
            return;
        }

        setFile(selectedFile);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/plain': ['.txt']
        },
        maxFiles: 1
    });

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            await uploadStabilityData(file);
            navigate('/stability/sessions');
        } catch (err: any) {
            if (err.response?.data?.code === 'VEHICLE_NOT_FOUND') {
                setError({
                    code: 'VEHICLE_NOT_FOUND',
                    message: err.response.data.message,
                    vehicleId: err.response.data.vehicleId
                });
            } else {
                setError({
                    message: err instanceof Error ? err.message : 'Error al subir el archivo'
                });
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleCreateVehicle = () => {
        if (error?.vehicleId) {
            navigate(`/vehicles/new?identifier=${error.vehicleId}`);
        } else {
            navigate('/vehicles/new');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">{t('subir_datos_estabilidad')}</h2>

                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{t('error')}</AlertTitle>
                        <AlertDescription>
                            {error.message}
                            {error.code === 'VEHICLE_NOT_FOUND' && (
                                <div className="mt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCreateVehicle}
                                        className="mt-2"
                                    >
                                        {t('crear_vehiculo')}
                                    </Button>
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                        ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 hover:border-primary'}`}
                >
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                        {isDragActive
                            ? t('suelta_archivo')
                            : t('arrastra_archivo')}
                    </p>
                </div>

                {file && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-600">
                            {t('archivo_seleccionado', { nombre: file.name })}
                        </p>
                        <Button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="mt-4"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('subiendo')}
                                </>
                            ) : (
                                t('subir_archivo')
                            )}
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}; 