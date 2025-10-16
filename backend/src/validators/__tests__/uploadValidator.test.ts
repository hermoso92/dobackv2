/**
 * 🧪 TESTS DEL VALIDADOR DE UPLOAD
 * 
 * Suite completa de tests para validación de archivos
 * 
 * @version 1.0
 * @date 2025-10-11
 */

import {
    FILE_NAME_PATTERN,
    LIMITS,
    parseFileName,
    validateAuthentication,
    validateFileContent,
    validateFileName,
    validateFileSize,
    validateMultipleFiles,
    validateUploadRequest,
} from '../uploadValidator';

describe('UploadValidator', () => {
    // ========================================================================
    // TESTS DE PATRÓN DE NOMBRE
    // ========================================================================

    describe('FILE_NAME_PATTERN', () => {
        it('debe aceptar nombres válidos de ESTABILIDAD', () => {
            expect('ESTABILIDAD_DOBACK001_20250101.txt').toMatch(FILE_NAME_PATTERN);
            expect('ESTABILIDAD_DOBACK999_20251231.txt').toMatch(FILE_NAME_PATTERN);
        });

        it('debe aceptar nombres válidos de GPS', () => {
            expect('GPS_DOBACK001_20250101.txt').toMatch(FILE_NAME_PATTERN);
            expect('GPS_DOBACK123_20250615.txt').toMatch(FILE_NAME_PATTERN);
        });

        it('debe aceptar nombres válidos de ROTATIVO', () => {
            expect('ROTATIVO_DOBACK001_20250101.txt').toMatch(FILE_NAME_PATTERN);
        });

        it('debe aceptar nombres válidos de CAN', () => {
            expect('CAN_DOBACK001_20250101.txt').toMatch(FILE_NAME_PATTERN);
        });

        it('debe ser case insensitive', () => {
            expect('estabilidad_doback001_20250101.txt').toMatch(FILE_NAME_PATTERN);
            expect('Estabilidad_DOBACK001_20250101.txt').toMatch(FILE_NAME_PATTERN);
        });

        it('debe rechazar nombres inválidos', () => {
            expect('INVALIDO_DOBACK001_20250101.txt').not.toMatch(FILE_NAME_PATTERN);
            expect('ESTABILIDAD_VEHICLE001_20250101.txt').not.toMatch(FILE_NAME_PATTERN);
            expect('ESTABILIDAD_DOBACK1_20250101.txt').not.toMatch(FILE_NAME_PATTERN); // Solo 1 dígito
            expect('ESTABILIDAD_DOBACK001_2025.txt').not.toMatch(FILE_NAME_PATTERN); // Fecha corta
            expect('ESTABILIDAD_DOBACK001_20250101.csv').not.toMatch(FILE_NAME_PATTERN); // Extensión incorrecta
        });
    });

    // ========================================================================
    // TESTS DE PARSEO DE NOMBRE
    // ========================================================================

    describe('parseFileName', () => {
        it('debe parsear correctamente un nombre válido', () => {
            const result = parseFileName('ESTABILIDAD_DOBACK001_20250115.txt');

            expect(result).not.toBeNull();
            expect(result?.type).toBe('ESTABILIDAD');
            expect(result?.vehicleId).toBe('DOBACK001');
            expect(result?.vehicleNumber).toBe('001');
            expect(result?.date).toBe('20250115');
            expect(result?.dateObject).toEqual(new Date(2025, 0, 15));
        });

        it('debe retornar null para nombres inválidos', () => {
            expect(parseFileName('archivo_invalido.txt')).toBeNull();
            expect(parseFileName('')).toBeNull();
        });

        it('debe manejar case insensitive', () => {
            const result = parseFileName('gps_doback123_20250201.txt');
            expect(result?.type).toBe('GPS');
        });
    });

    // ========================================================================
    // TESTS DE VALIDACIÓN DE NOMBRE
    // ========================================================================

    describe('validateFileName', () => {
        it('debe validar correctamente nombres válidos', () => {
            const result = validateFileName('GPS_DOBACK001_20250101.txt');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('debe rechazar nombres vacíos', () => {
            const result = validateFileName('');
            expect(result.valid).toBe(false);
            expect(result.errors[0].code).toBe('EMPTY_FILENAME');
        });

        it('debe rechazar extensión incorrecta', () => {
            const result = validateFileName('ESTABILIDAD_DOBACK001_20250101.csv');
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'INVALID_EXTENSION')).toBe(true);
        });

        it('debe rechazar formato incorrecto', () => {
            const result = validateFileName('archivo_invalido.txt');
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'INVALID_FORMAT')).toBe(true);
        });

        it('debe rechazar fecha inválida', () => {
            const result = validateFileName('GPS_DOBACK001_20251399.txt'); // Mes 13, día 99
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'INVALID_DATE')).toBe(true);
        });

        it('debe advertir sobre fechas muy antiguas', () => {
            const result = validateFileName('GPS_DOBACK001_20150101.txt');
            expect(result.warnings.length).toBeGreaterThan(0);
        });
    });

    // ========================================================================
    // TESTS DE VALIDACIÓN DE TAMAÑO
    // ========================================================================

    describe('validateFileSize', () => {
        it('debe validar tamaños correctos', () => {
            const result = validateFileSize(1024 * 1024); // 1 MB
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('debe rechazar archivos muy pequeños', () => {
            const result = validateFileSize(50); // 50 bytes
            expect(result.valid).toBe(false);
            expect(result.errors[0].code).toBe('FILE_TOO_SMALL');
        });

        it('debe rechazar archivos muy grandes', () => {
            const result = validateFileSize(150 * 1024 * 1024); // 150 MB
            expect(result.valid).toBe(false);
            expect(result.errors[0].code).toBe('FILE_TOO_LARGE');
        });

        it('debe advertir sobre archivos grandes', () => {
            const result = validateFileSize(60 * 1024 * 1024); // 60 MB
            expect(result.valid).toBe(true);
            expect(result.warnings.length).toBeGreaterThan(0);
        });
    });

    // ========================================================================
    // TESTS DE VALIDACIÓN DE CONTENIDO
    // ========================================================================

    describe('validateFileContent', () => {
        it('debe validar contenido correcto de ESTABILIDAD', () => {
            const content =
                'ESTABILIDAD;2025-01-01;DOBACK001;1\n' +
                'Fecha-Hora;ax;ay;az;gx;gy;gz;roll;pitch;yaw;si;accmag\n' +
                '2025-01-01 10:00:00;0.1;0.2;0.3;0.4;0.5;0.6;0.7;0.8;0.9;1.0;1.1\n' +
                '2025-01-01 10:00:01;0.1;0.2;0.3;0.4;0.5;0.6;0.7;0.8;0.9;1.0;1.1\n';

            const result = validateFileContent('ESTABILIDAD_DOBACK001_20250101.txt', content);
            expect(result.valid).toBe(true);
        });

        it('debe validar contenido correcto de GPS', () => {
            const content =
                'GPS;2025-01-01;DOBACK001;1\n' +
                'Fecha-Hora;latitud;longitud;altitud;hdop;fix;satellites;speed\n' +
                '2025-01-01 10:00:00;40.4168;-3.7038;650;1.2;3D;8;50\n';

            const result = validateFileContent('GPS_DOBACK001_20250101.txt', content);
            expect(result.valid).toBe(true);
        });

        it('debe rechazar archivos vacíos', () => {
            const result = validateFileContent('GPS_DOBACK001_20250101.txt', '');
            expect(result.valid).toBe(false);
            expect(result.errors[0].code).toBe('EMPTY_FILE');
        });

        it('debe rechazar archivos con muy pocas líneas', () => {
            const content = 'GPS;2025-01-01;DOBACK001;1\n';
            const result = validateFileContent('GPS_DOBACK001_20250101.txt', content);
            expect(result.valid).toBe(false);
            expect(result.errors[0].code).toBe('INSUFFICIENT_LINES');
        });

        it('debe rechazar cabecera incorrecta', () => {
            const content =
                'INCORRECTO;2025-01-01;DOBACK001;1\n' +
                'Fecha-Hora;campo1;campo2\n' +
                '2025-01-01 10:00:00;valor1;valor2\n';

            const result = validateFileContent('GPS_DOBACK001_20250101.txt', content);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'INVALID_HEADER')).toBe(true);
        });

        it('debe advertir sobre archivos con pocas mediciones', () => {
            const content =
                'GPS;2025-01-01;DOBACK001;1\n' +
                'Fecha-Hora;latitud;longitud\n' +
                '2025-01-01 10:00:00;40.4168;-3.7038\n';

            const result = validateFileContent('GPS_DOBACK001_20250101.txt', content);
            expect(result.warnings.length).toBeGreaterThan(0);
        });
    });

    // ========================================================================
    // TESTS DE VALIDACIÓN DE MÚLTIPLES ARCHIVOS
    // ========================================================================

    describe('validateMultipleFiles', () => {
        it('debe validar correctamente un conjunto de archivos válidos', () => {
            const files = [
                {
                    originalname: 'ESTABILIDAD_DOBACK001_20250101.txt',
                    size: 1024 * 1024,
                },
                {
                    originalname: 'GPS_DOBACK001_20250101.txt',
                    size: 512 * 1024,
                },
            ];

            const result = validateMultipleFiles(files);
            expect(result.valid).toBe(true);
        });

        it('debe rechazar cuando no hay archivos', () => {
            const result = validateMultipleFiles([]);
            expect(result.valid).toBe(false);
            expect(result.errors[0].code).toBe('NO_FILES');
        });

        it('debe rechazar cuando hay demasiados archivos', () => {
            const files = Array.from({ length: 25 }, (_, i) => ({
                originalname: `ESTABILIDAD_DOBACK${String(i + 1).padStart(3, '0')}_20250101.txt`,
                size: 1024,
            }));

            const result = validateMultipleFiles(files);
            expect(result.valid).toBe(false);
            expect(result.errors[0].code).toBe('TOO_MANY_FILES');
        });

        it('debe detectar archivos duplicados', () => {
            const files = [
                {
                    originalname: 'GPS_DOBACK001_20250101.txt',
                    size: 1024,
                },
                {
                    originalname: 'GPS_DOBACK001_20250101.txt',
                    size: 1024,
                },
            ];

            const result = validateMultipleFiles(files);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'DUPLICATE_FILE')).toBe(true);
        });

        it('debe advertir sobre tamaño total grande', () => {
            const files = [
                {
                    originalname: 'ESTABILIDAD_DOBACK001_20250101.txt',
                    size: 150 * 1024 * 1024,
                },
                {
                    originalname: 'GPS_DOBACK001_20250101.txt',
                    size: 60 * 1024 * 1024,
                },
            ];

            const result = validateMultipleFiles(files);
            expect(result.warnings.length).toBeGreaterThan(0);
        });
    });

    // ========================================================================
    // TESTS DE VALIDACIÓN DE AUTENTICACIÓN
    // ========================================================================

    describe('validateAuthentication', () => {
        it('debe validar autenticación correcta', () => {
            const result = validateAuthentication('user123', 'org456');
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('debe rechazar sin userId', () => {
            const result = validateAuthentication(undefined, 'org456');
            expect(result.valid).toBe(false);
            expect(result.errors[0].code).toBe('MISSING_USER_ID');
        });

        it('debe rechazar sin organizationId', () => {
            const result = validateAuthentication('user123', undefined);
            expect(result.valid).toBe(false);
            expect(result.errors[0].code).toBe('MISSING_ORGANIZATION_ID');
        });

        it('debe rechazar con valores vacíos', () => {
            const result = validateAuthentication('', '');
            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(2);
        });
    });

    // ========================================================================
    // TESTS DE VALIDACIÓN COMPLETA
    // ========================================================================

    describe('validateUploadRequest', () => {
        it('debe validar request completo válido', () => {
            const result = validateUploadRequest({
                files: [
                    {
                        originalname: 'ESTABILIDAD_DOBACK001_20250101.txt',
                        size: 1024 * 1024,
                    },
                ],
                userId: 'user123',
                organizationId: 'org456',
            });

            expect(result.valid).toBe(true);
            expect(result.summary.validFiles).toBe(1);
            expect(result.summary.invalidFiles).toBe(0);
        });

        it('debe rechazar request sin autenticación', () => {
            const result = validateUploadRequest({
                files: [
                    {
                        originalname: 'ESTABILIDAD_DOBACK001_20250101.txt',
                        size: 1024 * 1024,
                    },
                ],
                userId: undefined,
                organizationId: undefined,
            });

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('debe proporcionar resumen correcto', () => {
            const result = validateUploadRequest({
                files: [
                    {
                        originalname: 'ESTABILIDAD_DOBACK001_20250101.txt',
                        size: 1024 * 1024,
                    },
                    {
                        originalname: 'archivo_invalido.txt',
                        size: 512 * 1024,
                    },
                ],
                userId: 'user123',
                organizationId: 'org456',
            });

            expect(result.summary.totalFiles).toBe(2);
            expect(result.summary.validFiles).toBe(1);
            expect(result.summary.invalidFiles).toBe(1);
            expect(result.summary.totalSize).toBe(1024 * 1024 + 512 * 1024);
        });

        it('debe acumular todos los errores y advertencias', () => {
            const result = validateUploadRequest({
                files: [
                    {
                        originalname: 'archivo_invalido.txt',
                        size: 50, // Muy pequeño
                    },
                ],
                userId: undefined, // Falta userId
                organizationId: 'org456',
            });

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1); // Múltiples errores
        });
    });

    // ========================================================================
    // TESTS DE LÍMITES
    // ========================================================================

    describe('LIMITS', () => {
        it('debe tener límites definidos correctamente', () => {
            expect(LIMITS.MAX_FILE_SIZE).toBe(100 * 1024 * 1024);
            expect(LIMITS.MAX_FILES_PER_UPLOAD).toBe(20);
            expect(LIMITS.MIN_FILE_SIZE).toBe(100);
        });
    });
});

