import { AlertCircle, CheckCircle, File, Upload, X } from 'lucide-react';
import React, { useState } from 'react';
import { API_CONFIG } from '../../config/api';
import { logger } from '../../utils/logger';

interface UploadedFile {
    file: File;
    type: string;
    vehiculo: string;
    fecha: string;
}

export const SingleSessionUpload: React.FC = () => {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Validar nombre de archivo
    const validateFileName = (fileName: string): { valid: boolean; info?: { tipo: string; vehiculo: string; fecha: string }; error?: string } => {
        const regex = /^(ESTABILIDAD|GPS|ROTATIVO)_DOBACK(\d{3})_(\d{8})\.txt$/i;
        const match = fileName.match(regex);

        if (!match) {
            return {
                valid: false,
                error: 'Formato inválido. Debe ser: TIPO_DOBACK###_YYYYMMDD.txt'
            };
        }

        return {
            valid: true,
            info: {
                tipo: match[1]!.toUpperCase(),
                vehiculo: match[2]!,
                fecha: match[3]!
            }
        };
    };

    // Manejar selección de archivos
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        const newFiles: UploadedFile[] = [];
        const errors: string[] = [];

        for (const file of selectedFiles) {
            const validation = validateFileName(file.name);

            if (!validation.valid) {
                errors.push(`${file.name}: ${validation.error}`);
                continue;
            }

            if (validation.info) {
                newFiles.push({
                    file,
                    type: validation.info.tipo,
                    vehiculo: validation.info.vehiculo,
                    fecha: validation.info.fecha
                });
            }
        }

        if (errors.length > 0) {
            setError(errors.join('\n'));
        } else {
            setError(null);
        }

        setFiles(prevFiles => {
            const combined = [...prevFiles, ...newFiles];
            // Limitar a 3 archivos
            if (combined.length > 3) {
                setError('Solo se permiten 3 archivos. Se tomarán los primeros 3.');
                return combined.slice(0, 3);
            }
            return combined;
        });
    };

    // Remover archivo
    const removeFile = (index: number) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
        setError(null);
        setResult(null);
    };

    // Validar que tengamos exactamente 3 archivos del mismo vehículo y fecha
    const validateUpload = (): { valid: boolean; error?: string } => {
        if (files.length !== 3) {
            return { valid: false, error: `Se requieren exactamente 3 archivos. Tienes ${files.length}.` };
        }

        // Verificar que sean del mismo vehículo
        const vehiculos = [...new Set(files.map(f => f.vehiculo))];
        if (vehiculos.length !== 1) {
            return { valid: false, error: `Los 3 archivos deben ser del mismo vehículo.` };
        }

        // Verificar que sean de la misma fecha
        const fechas = [...new Set(files.map(f => f.fecha))];
        if (fechas.length !== 1) {
            return { valid: false, error: `Los 3 archivos deben ser de la misma fecha.` };
        }

        // Verificar que tengamos los 3 tipos necesarios
        const tipos = files.map(f => f.type).sort();
        const tiposEsperados = ['ESTABILIDAD', 'GPS', 'ROTATIVO'].sort();

        if (JSON.stringify(tipos) !== JSON.stringify(tiposEsperados)) {
            return { valid: false, error: `Se requieren archivos ESTABILIDAD, GPS y ROTATIVO.` };
        }

        return { valid: true };
    };

    // Subir archivos
    const handleUpload = async () => {
        const validation = validateUpload();
        if (!validation.valid) {
            setError(validation.error || 'Validación fallida');
            return;
        }

        setUploading(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            files.forEach(({ file }) => {
                formData.append('files', file);
            });

            logger.info('Subiendo sesión individual...', {
                files: files.map(f => f.file.name)
            });

            const response = await fetch(`${API_CONFIG.BASE_URL}/upload/single-session`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Error al subir archivos');
            }

            logger.info('Sesión creada exitosamente', data);
            setResult(data);
            setFiles([]); // Limpiar archivos después de subir

        } catch (err: any) {
            logger.error('Error al subir sesión', err);
            setError(err.message || 'Error al subir archivos');
        } finally {
            setUploading(false);
        }
    };

    const validation = files.length > 0 ? validateUpload() : null;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Upload className="w-6 h-6" />
                    Subir Sesión Individual
                </h2>

                <p className="text-gray-600 mb-6">
                    Sube exactamente 3 archivos (ESTABILIDAD, GPS y ROTATIVO) del mismo vehículo y fecha para crear una sesión individual.
                </p>

                {/* Selector de archivos */}
                <div className="mb-6">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                        Seleccionar archivos (máximo 3)
                    </label>
                    <input
                        type="file"
                        multiple
                        accept=".txt"
                        onChange={handleFileSelect}
                        disabled={uploading || files.length >= 3}
                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Formato: TIPO_DOBACK###_YYYYMMDD.txt
                    </p>
                </div>

                {/* Lista de archivos seleccionados */}
                {files.length > 0 && (
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Archivos seleccionados ({files.length}/3)</h3>
                        <div className="space-y-2">
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <File className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="font-medium text-sm">{file.file.name}</p>
                                            <p className="text-xs text-gray-500">
                                                Tipo: {file.type} | Vehículo: DOBACK{file.vehiculo} | Fecha: {file.fecha}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFile(index)}
                                        disabled={uploading}
                                        className="p-1 hover:bg-gray-200 rounded"
                                    >
                                        <X className="w-5 h-5 text-gray-600" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Validación */}
                        {validation && (
                            <div className={`mt-4 p-4 rounded-lg ${validation.valid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                                {validation.valid ? (
                                    <div className="flex items-center gap-2 text-green-700">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-medium">Archivos válidos. Listos para subir.</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-yellow-700">
                                        <AlertCircle className="w-5 h-5" />
                                        <span className="font-medium">{validation.error}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Botón de subida */}
                <button
                    onClick={handleUpload}
                    disabled={!validation?.valid || uploading}
                    className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 ${validation?.valid && !uploading
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {uploading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                            Subiendo...
                        </>
                    ) : (
                        <>
                            <Upload className="w-5 h-5" />
                            Subir Sesión
                        </>
                    )}
                </button>

                {/* Error */}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700">
                            <AlertCircle className="w-5 h-5" />
                            <span className="font-medium">Error:</span>
                        </div>
                        <p className="text-red-600 mt-1 whitespace-pre-wrap">{error}</p>
                    </div>
                )}

                {/* Resultado exitoso */}
                {result && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700 mb-3">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-bold">¡Sesión creada exitosamente!</span>
                        </div>

                        <div className="space-y-2 text-sm">
                            <p><strong>Vehículo:</strong> {result.vehiculo}</p>
                            <p><strong>Fecha:</strong> {result.fecha}</p>
                            <p><strong>Session ID:</strong> <code className="bg-green-100 px-2 py-1 rounded">{result.sessionId}</code></p>

                            {result.data?.sessionDetail && (
                                <div className="mt-4 pt-4 border-t border-green-300">
                                    <h4 className="font-bold mb-2">Detalles de la sesión:</h4>
                                    <ul className="space-y-1 text-sm">
                                        <li>• Número de sesión: {result.data.sessionDetail.sessionNumber}</li>
                                        <li>• Duración: {result.data.sessionDetail.durationFormatted}</li>
                                        <li>• Puntos GPS: {result.data.sessionDetail.gpsDataCount}</li>
                                        <li>• Puntos estabilidad: {result.data.sessionDetail.stabilityDataCount}</li>
                                        {result.data.postProcessing && (
                                            <>
                                                <li>• Eventos generados: {result.data.postProcessing.eventsGenerated}</li>
                                                <li>• Segmentos generados: {result.data.postProcessing.segmentsGenerated}</li>
                                            </>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

