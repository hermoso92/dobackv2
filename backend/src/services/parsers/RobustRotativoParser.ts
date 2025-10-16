import { createLogger } from '../../utils/logger';

const logger = createLogger('RobustRotativoParser');

export interface RotativoMeasurement {
    timestamp: Date;
    state: string; // '0' o '1'
    key?: number; // Clave operacional: 0=Taller, 1=Parque, 2=Emergencia, 3=Incendio, 5=Regreso
}

export interface RotativoParsingResult {
    mediciones: RotativoMeasurement[];
    problemas: Array<{ tipo: string; linea: number; descripcion: string }>;
    estadisticas: {
        total: number;
        validas: number;
        timestampsInvalidos: number;
        estadosInvalidos: number;
        porcentajeValido: number;
    };
}

/**
 * Parser robusto de archivos ROTATIVO
 * Formato: DD/MM/YYYY-HH:MM:SS;Estado
 * Estado: 0 = OFF, 1 = ON
 */
export function parseRotativoRobust(buffer: Buffer, fechaSesion?: Date): RotativoParsingResult {
    const contenido = buffer.toString('utf-8');
    const lineas = contenido.split('\n');

    const mediciones: RotativoMeasurement[] = [];
    const problemas: Array<{ tipo: string; linea: number; descripcion: string }> = [];

    let contadores = {
        total: 0,
        validas: 0,
        timestampsInvalidos: 0,
        estadosInvalidos: 0
    };

    // Detectar fecha de sesión desde cabecera
    let fechaSesionDetectada: Date | null = fechaSesion || null;

    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i].trim();

        // Saltar líneas vacías
        if (!linea) continue;

        // Detectar cabecera y extraer fecha de sesión
        if (linea.startsWith('ROTATIVO;')) {
            const match = linea.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (match && !fechaSesionDetectada) {
                const [_, dia, mes, año] = match;
                fechaSesionDetectada = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
                logger.info(`Fecha de sesión detectada: ${fechaSesionDetectada.toISOString()}`);
            }
            continue;
        }

        // Saltar cabecera de columnas
        if (linea.startsWith('Fecha-Hora;')) {
            continue;
        }

        // Parsear línea de datos: DD/MM/YYYY-HH:MM:SS;Estado[;Clave]
        if (linea.includes(';')) {
            contadores.total++;

            const partes = linea.split(';');

            if (partes.length < 2) {
                problemas.push({
                    tipo: 'FORMATO_INVALIDO',
                    linea: i + 1,
                    descripcion: `Esperadas al menos 2 columnas, encontradas ${partes.length}`
                });
                continue;
            }

            try {
                // Parsear timestamp: DD/MM/YYYY-HH:MM:SS
                const timestampStr = partes[0].trim();
                const match = timestampStr.match(/(\d{2})\/(\d{2})\/(\d{4})-(\d{2}):(\d{2}):(\d{2})/);

                if (!match) {
                    contadores.timestampsInvalidos++;
                    problemas.push({
                        tipo: 'TIMESTAMP_INVALIDO',
                        linea: i + 1,
                        descripcion: `Timestamp inválido: ${timestampStr}`
                    });
                    continue;
                }

                const [_, dia, mes, año, h, m, s] = match;
                const timestamp = new Date(
                    parseInt(año),
                    parseInt(mes) - 1,
                    parseInt(dia),
                    parseInt(h),
                    parseInt(m),
                    parseInt(s)
                );

                // Validar estado
                const state = partes[1].trim();

                if (state !== '0' && state !== '1') {
                    contadores.estadosInvalidos++;
                    problemas.push({
                        tipo: 'ESTADO_INVALIDO',
                        linea: i + 1,
                        descripcion: `Estado debe ser 0 o 1, recibido: ${state}`
                    });
                    continue;
                }

                // Extraer clave operacional si existe (columna 3)
                let key: number | undefined = undefined;
                if (partes.length >= 3) {
                    const keyStr = partes[2].trim();
                    const keyNum = parseInt(keyStr);

                    // Validar que sea una clave válida (0,1,2,3,5)
                    if ([0, 1, 2, 3, 5].includes(keyNum)) {
                        key = keyNum;
                    } else if (keyStr && keyStr !== '') {
                        logger.warn(`Clave inválida en línea ${i + 1}: ${keyStr} (esperado: 0,1,2,3,5)`);
                    }
                }

                // Medición válida
                mediciones.push({
                    timestamp,
                    state,
                    key
                });

                contadores.validas++;

            } catch (error: any) {
                problemas.push({
                    tipo: 'ERROR_PARSEADO',
                    linea: i + 1,
                    descripcion: `Error al parsear: ${error.message}`
                });
            }
        }
    }

    const porcentajeValido = contadores.total > 0
        ? (contadores.validas / contadores.total) * 100
        : 0;

    logger.info('ROTATIVO parseado', {
        total: contadores.total,
        validas: contadores.validas,
        porcentajeValido: porcentajeValido.toFixed(2)
    });

    return {
        mediciones,
        problemas,
        estadisticas: {
            ...contadores,
            porcentajeValido
        }
    };
}

/**
 * Detecta sesiones múltiples en un archivo ROTATIVO
 */
export function detectarSesionesRotativo(buffer: Buffer): Array<{ numeroSesion: number; fecha: string; inicio: number; fin: number }> {
    const contenido = buffer.toString('utf-8');
    const lineas = contenido.split('\n');

    const sesiones: Array<{ numeroSesion: number; fecha: string; inicio: number; fin: number }> = [];

    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i].trim();

        // Detectar cabecera de sesión: ROTATIVO;DD/MM/YYYY-HH:MM:SS;DOBACK###;Sesión:N
        const match = linea.match(/^ROTATIVO;(\d{2}\/\d{2}\/\d{4})-\d{2}:\d{2}:\d{2};DOBACK\d+;Sesión:(\d+)/);

        if (match) {
            // Cerrar sesión anterior
            if (sesiones.length > 0) {
                sesiones[sesiones.length - 1].fin = i - 1;
            }

            // Nueva sesión
            sesiones.push({
                numeroSesion: parseInt(match[2]),
                fecha: match[1],
                inicio: i,
                fin: lineas.length - 1
            });
        }
    }

    logger.info(`Detectadas ${sesiones.length} sesiones en archivo ROTATIVO`);

    return sesiones;
}

/**
 * Crea un mapa de estados de rotativo por timestamp para correlación rápida
 */
export function crearMapaRotativo(mediciones: RotativoMeasurement[]): Map<number, string> {
    const mapa = new Map<number, string>();

    mediciones.forEach(m => {
        mapa.set(m.timestamp.getTime(), m.state);
    });

    return mapa;
}

/**
 * Encuentra el estado de rotativo más cercano a un timestamp dado
 * Busca en una ventana de ±maxDiffMs milisegundos
 */
export function encontrarEstadoMasCercano(
    timestamp: Date,
    rotativoMap: Map<number, string>,
    maxDiffMs: number = 5000
): string | null {
    const targetTime = timestamp.getTime();
    let estadoMasCercano: string | null = null;
    let menorDiferencia = Infinity;

    for (const [rotativoTime, state] of Array.from(rotativoMap.entries())) {
        const diff = Math.abs(targetTime - rotativoTime);

        if (diff < menorDiferencia && diff <= maxDiffMs) {
            menorDiferencia = diff;
            estadoMasCercano = state;
        }
    }

    return estadoMasCercano;
}

