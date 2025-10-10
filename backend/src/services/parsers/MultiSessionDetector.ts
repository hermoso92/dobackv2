import { createLogger } from '../../utils/logger';

const logger = createLogger('MultiSessionDetector');

export interface SessionHeader {
    tipo: string; // "ESTABILIDAD", "GPS", "ROTATIVO"
    fecha: string;
    fechaDate: Date;
    vehiculo: string;
    numeroSesion: number;
    inicioLinea: number;
    finLinea: number;
}

/**
 * Detecta sesiones múltiples en un archivo Doback
 * Un archivo puede contener varias sesiones identificadas por sus cabeceras
 */
export function detectarSesionesMultiples(buffer: Buffer, tipoEsperado?: string): SessionHeader[] {
    const contenido = buffer.toString('utf-8');
    const lineas = contenido.split('\n');

    const sesiones: SessionHeader[] = [];

    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i].trim();

        // Detectar cabecera de sesión (todos los tipos)
        // Formato: TIPO;DD/MM/YYYY HH:MM:SS;DOBACK###;Sesión:N
        // O:      TIPO;DD/MM/YYYY-HH:MM:SS;DOBACK###;Sesión:N
        const match = linea.match(/^(ESTABILIDAD|GPS|ROTATIVO|CAN);(\d{2}\/\d{2}\/\d{4})[\s-](\d{2}:\d{2}:\d{2});(DOBACK\d+);Sesión:(\d+)/);

        if (match) {
            const [_, tipo, fecha, hora, vehiculo, sesionNum] = match;

            // Si se especificó un tipo, validar
            if (tipoEsperado && tipo !== tipoEsperado) {
                logger.warn(`Tipo de archivo inesperado: esperado ${tipoEsperado}, encontrado ${tipo}`);
            }

            // Cerrar sesión anterior
            if (sesiones.length > 0) {
                sesiones[sesiones.length - 1].finLinea = i - 1;
            }

            // Parsear fecha
            const [dia, mes, año] = fecha.split('/');
            const [h, m, s] = hora.split(':');
            const fechaDate = new Date(
                parseInt(año),
                parseInt(mes) - 1,
                parseInt(dia),
                parseInt(h),
                parseInt(m),
                parseInt(s)
            );

            // Nueva sesión
            sesiones.push({
                tipo,
                fecha,
                fechaDate,
                vehiculo,
                numeroSesion: parseInt(sesionNum),
                inicioLinea: i,
                finLinea: lineas.length - 1 // Será actualizado si hay más sesiones
            });

            logger.info(`Sesión detectada: ${tipo} ${vehiculo} #${sesionNum} ${fecha}`);
        }
    }

    // Si no se detectó ninguna sesión, intentar con formato alternativo
    if (sesiones.length === 0) {
        logger.warn('No se detectaron cabeceras de sesión estándar, intentando formato alternativo');

        // Formato alternativo sin "Sesión:" explícito
        for (let i = 0; i < lineas.length; i++) {
            const linea = lineas[i].trim();
            const match = linea.match(/^(ESTABILIDAD|GPS|ROTATIVO);(\d{2}\/\d{2}\/\d{4})[\s-](\d{2}:\d{2}:\d{2});(DOBACK\d+)/);

            if (match) {
                const [_, tipo, fecha, hora, vehiculo] = match;

                const [dia, mes, año] = fecha.split('/');
                const [h, m, s] = hora.split(':');
                const fechaDate = new Date(
                    parseInt(año),
                    parseInt(mes) - 1,
                    parseInt(dia),
                    parseInt(h),
                    parseInt(m),
                    parseInt(s)
                );

                sesiones.push({
                    tipo,
                    fecha,
                    fechaDate,
                    vehiculo,
                    numeroSesion: 1, // Asumimos sesión 1 si no se especifica
                    inicioLinea: i,
                    finLinea: lineas.length - 1
                });

                logger.info(`Sesión detectada (formato alternativo): ${tipo} ${vehiculo} ${fecha}`);
                break; // Solo detectar una sesión en formato alternativo
            }
        }
    }

    logger.info(`Total de sesiones detectadas: ${sesiones.length}`);

    return sesiones;
}

/**
 * Extrae el contenido de una sesión específica del buffer
 */
export function extraerContenidoSesion(buffer: Buffer, sesion: SessionHeader): Buffer {
    const contenido = buffer.toString('utf-8');
    const lineas = contenido.split('\n');

    const lineasSesion = lineas.slice(sesion.inicioLinea, sesion.finLinea + 1);

    return Buffer.from(lineasSesion.join('\n'), 'utf-8');
}

/**
 * Valida el nombre de archivo según convención Doback
 */
export function validarNombreArchivo(nombreArchivo: string): {
    valido: boolean;
    tipo?: string;
    vehiculo?: string;
    fecha?: string;
    error?: string;
} {
    // Formato esperado: TIPO_DOBACK###_YYYYMMDD.txt
    const regex = /^(ESTABILIDAD|GPS|ROTATIVO|CAN)_DOBACK(\d{3})_(\d{8})\.txt$/i;
    const match = nombreArchivo.match(regex);

    if (!match) {
        return {
            valido: false,
            error: 'Formato de archivo inválido. Debe ser: TIPO_DOBACK###_YYYYMMDD.txt'
        };
    }

    const [_, tipo, numero, fechaStr] = match;

    // Validar fecha
    const año = parseInt(fechaStr.substring(0, 4));
    const mes = parseInt(fechaStr.substring(4, 6));
    const dia = parseInt(fechaStr.substring(6, 8));

    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) {
        return {
            valido: false,
            error: `Fecha inválida en nombre de archivo: ${fechaStr}`
        };
    }

    return {
        valido: true,
        tipo: tipo.toUpperCase(),
        vehiculo: `DOBACK${numero}`,
        fecha: `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${año}`
    };
}

/**
 * Agrupa archivos por vehículo y fecha para procesamiento conjunto
 */
export interface ArchivoAgrupado {
    vehiculo: string;
    fecha: string;
    archivos: {
        estabilidad?: Buffer;
        gps?: Buffer;
        rotativo?: Buffer;
        can?: Buffer;
    };
}

export function agruparArchivosPorVehiculo(archivos: Array<{ nombre: string; buffer: Buffer }>): ArchivoAgrupado[] {
    const grupos = new Map<string, ArchivoAgrupado>();

    for (const archivo of archivos) {
        const validacion = validarNombreArchivo(archivo.nombre);

        if (!validacion.valido || !validacion.vehiculo || !validacion.fecha) {
            logger.warn(`Archivo ignorado: ${archivo.nombre}`, { error: validacion.error });
            continue;
        }

        const clave = `${validacion.vehiculo}_${validacion.fecha}`;

        if (!grupos.has(clave)) {
            grupos.set(clave, {
                vehiculo: validacion.vehiculo,
                fecha: validacion.fecha,
                archivos: {}
            });
        }

        const grupo = grupos.get(clave)!;

        switch (validacion.tipo) {
            case 'ESTABILIDAD':
                grupo.archivos.estabilidad = archivo.buffer;
                break;
            case 'GPS':
                grupo.archivos.gps = archivo.buffer;
                break;
            case 'ROTATIVO':
                grupo.archivos.rotativo = archivo.buffer;
                break;
            case 'CAN':
                grupo.archivos.can = archivo.buffer;
                break;
        }
    }

    logger.info(`Archivos agrupados: ${grupos.size} grupos de vehículo/fecha`);

    return Array.from(grupos.values());
}

