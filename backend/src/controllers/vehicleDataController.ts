import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { VehicleDataResponse } from '../types/vehicleData';
import { parseCANData, parseGPSData, parseStabilityData } from '../utils/dataParser';
import { logger } from '../utils/logger';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const TIMEOUT_MS = 60000; // 60 segundos de timeout

export const getVehicleData = async (req: Request, res: Response) => {
    const timeoutId = setTimeout(() => {
        logger.error('Timeout al obtener datos del vehículo');
        res.status(504).json({ error: 'La solicitud ha excedido el tiempo de espera' });
    }, TIMEOUT_MS);

    try {
        const { vehicleId, date, dataType, sessionId } = req.params;

        if (!vehicleId || !date) {
            clearTimeout(timeoutId);
            return res.status(400).json({ error: 'Se requieren vehicleId y date' });
        }

        const formattedDate = date.replace(/-/g, '');
        const basePath = path.join(UPLOADS_DIR, 'cosigein', vehicleId, formattedDate);

        // Verificar si el directorio existe
        try {
            await fs.access(basePath);
        } catch (error) {
            clearTimeout(timeoutId);
            logger.warn(`Directorio no encontrado: ${basePath}`);
            return res
                .status(404)
                .json({ error: 'No se encontraron datos para la fecha especificada' });
        }

        const response: VehicleDataResponse = {};

        if (!dataType || dataType === 'all') {
            await Promise.all([
                readStabilityData(basePath, vehicleId, date, response),
                readCANData(basePath, vehicleId, date, response),
                readGPSData(basePath, vehicleId, date, response)
            ]);
        } else {
            await readSpecificDataType(basePath, dataType, vehicleId, date, response);
        }

        // Filtrar por sessionId si se proporciona
        if (sessionId) {
            filterBySessionId(response, parseInt(sessionId));
        }

        if (Object.keys(response).length === 0) {
            clearTimeout(timeoutId);
            return res.status(404).json({ error: 'No se encontraron datos' });
        }

        clearTimeout(timeoutId);
        res.json(response);
    } catch (error) {
        clearTimeout(timeoutId);
        logger.error('Error procesando datos del vehículo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

async function readStabilityData(
    basePath: string,
    vehicleId: string,
    date: string,
    response: VehicleDataResponse
) {
    try {
        const stabilityContent = await fs.readFile(
            path.join(basePath, `0005_ESTABILIDAD_${vehicleId}_${date}.txt`),
            'utf-8'
        );
        response.stability = parseStabilityData(stabilityContent);
    } catch (error) {
        logger.warn('Error leyendo datos de estabilidad:', error);
    }
}

async function readCANData(
    basePath: string,
    vehicleId: string,
    date: string,
    response: VehicleDataResponse
) {
    try {
        const canContent = await fs.readFile(
            path.join(basePath, `0005_CAN_${vehicleId}_${date}.csv`),
            'utf-8'
        );
        response.can = parseCANData(canContent);
    } catch (error) {
        logger.warn('Error leyendo datos CAN:', error);
    }
}

async function readGPSData(
    basePath: string,
    vehicleId: string,
    date: string,
    response: VehicleDataResponse
) {
    try {
        const gpsContent = await fs.readFile(
            path.join(basePath, `0005_GPS_${vehicleId}_${date}.csv`),
            'utf-8'
        );
        response.gps = parseGPSData(gpsContent);
    } catch (error) {
        logger.warn('Error leyendo datos GPS:', error);
    }
}

async function readSpecificDataType(
    basePath: string,
    dataType: string,
    vehicleId: string,
    date: string,
    response: VehicleDataResponse
) {
    const fileName = `0005_${dataType.toUpperCase()}_${vehicleId}_${date}.${
        dataType.toLowerCase() === 'estabilidad' ? 'txt' : 'csv'
    }`;
    try {
        const content = await fs.readFile(path.join(basePath, fileName), 'utf-8');

        switch (dataType.toLowerCase()) {
            case 'estabilidad':
                response.stability = parseStabilityData(content);
                break;
            case 'can':
                response.can = parseCANData(content);
                break;
            case 'gps':
                response.gps = parseGPSData(content);
                break;
            default:
                throw new Error('Tipo de datos inválido');
        }
    } catch (error) {
        logger.error(`Error leyendo datos de tipo ${dataType}:`, error);
        throw error;
    }
}

function filterBySessionId(response: VehicleDataResponse, sessionId: number) {
    if (response.stability) {
        response.stability = response.stability.filter((s) => s.sessionId === sessionId);
    }
    if (response.can) {
        response.can = response.can.filter((s) => s.sessionId === sessionId);
    }
    if (response.gps) {
        response.gps = response.gps.filter((s) => s.sessionId === sessionId);
    }
}
